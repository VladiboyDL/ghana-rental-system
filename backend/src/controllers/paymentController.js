const { db } = require('../config/database');
const {
  generateId,
  generatePaymentReference,
  calculatePaymentBreakdown
} = require('../utils/helpers');
const { processPayment } = require('../simulators/mobileMoney');
const { sendPaymentReceipt, sendLandlordPaymentNotification } = require('../simulators/sms');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

// Calculate payment breakdown
const calculateBreakdown = async (req, res) => {
  try {
    const { contractId, amount } = req.body;

    if (!contractId || !amount) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Contract ID and amount are required'
        }
      });
    }

    // Get contract and landlord
    const result = await db.query(`
      SELECT c.*, u.* FROM contracts c
      JOIN users u ON c.landlord_id = u.id
      WHERE c.id = $1
    `, [contractId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

    const contract = result.rows[0];
    const breakdown = calculatePaymentBreakdown(amount, contract, contract);

    res.json({
      success: true,
      data: {
        grossAmount: breakdown.grossAmount,
        taxAmount: Math.round(breakdown.taxAmount * 100) / 100,
        taxRate: Math.round(breakdown.taxRate * 10000) / 100 + '%',
        platformFee: Math.round(breakdown.platformFee * 100) / 100,
        netAmount: Math.round(breakdown.netAmount * 100) / 100,
        currency: 'GHS'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Initiate payment
const initiatePayment = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { contractId, amount, paymentMethod, phoneNumber, periodStart, periodEnd } = req.body;

    // Validate required fields
    if (!contractId || !amount || !paymentMethod || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: contractId, amount, paymentMethod, periodStart, periodEnd'
        }
      });
    }

    // Validate payment method
    if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_METHOD',
          message: 'Invalid payment method'
        }
      });
    }

    // Get contract
    const contractResult = await db.query(`
      SELECT c.*, p.neighborhood, p.district
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      WHERE c.id = $1
    `, [contractId]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

    const contract = contractResult.rows[0];

    if (contract.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not the tenant on this contract'
        }
      });
    }

    if (contract.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Contract is not active'
        }
      });
    }

    // Get landlord and tenant
    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [contract.landlord_id]);
    const tenantResult = await db.query('SELECT * FROM users WHERE id = $1', [tenantId]);
    const landlord = landlordResult.rows[0];
    const tenant = tenantResult.rows[0];

    // Calculate payment breakdown
    const breakdown = calculatePaymentBreakdown(amount, landlord, contract);

    // Create payment record
    const paymentId = generateId();
    const paymentReference = generatePaymentReference();

    await db.query(`
      INSERT INTO payments (
        id, payment_reference, contract_id, tenant_id, landlord_id,
        gross_amount, tax_amount, net_amount, platform_fee,
        period_start, period_end, payment_method, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PROCESSING')
    `, [
      paymentId,
      paymentReference,
      contractId,
      tenantId,
      contract.landlord_id,
      breakdown.grossAmount,
      breakdown.taxAmount,
      breakdown.netAmount,
      breakdown.platformFee,
      periodStart,
      periodEnd,
      paymentMethod
    ]);

    // Process payment (simulated)
    const paymentResult = await processPayment({
      amount: breakdown.grossAmount,
      provider: paymentMethod,
      phoneNumber: phoneNumber || tenant.phone,
      reference: paymentReference
    });

    if (paymentResult.success) {
      // Update payment status
      await db.query(`
        UPDATE payments
        SET status = 'COMPLETED',
            provider_reference = $1,
            completed_at = NOW()
        WHERE id = $2
      `, [paymentResult.data.providerReference, paymentId]);

      // Update contract total tax withheld
      await db.query(`
        UPDATE contracts
        SET total_tax_withheld = COALESCE(total_tax_withheld, 0) + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [breakdown.taxAmount, contractId]);

      // Send notifications
      const landlordName = landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`;
      const tenantName = tenant.is_corporate ? tenant.company_name : `${tenant.first_name} ${tenant.last_name}`;
      const propertyAddress = `${contract.neighborhood || ''}, ${contract.district}`.trim().replace(/^,\s*/, '');

      await sendPaymentReceipt(
        tenant.phone,
        paymentReference,
        breakdown.grossAmount,
        landlordName,
        periodStart,
        periodEnd
      );

      await sendLandlordPaymentNotification(
        landlord.phone,
        tenantName,
        breakdown.grossAmount,
        breakdown.netAmount,
        propertyAddress
      );

      res.json({
        success: true,
        data: {
          paymentId,
          paymentReference,
          status: 'COMPLETED',
          grossAmount: breakdown.grossAmount,
          taxAmount: breakdown.taxAmount,
          netAmount: breakdown.netAmount,
          platformFee: breakdown.platformFee,
          providerReference: paymentResult.data.providerReference,
          message: 'Payment successful. Tax withheld and remitted to GRA.'
        }
      });
    } else {
      // Update payment status to failed
      await db.query(`
        UPDATE payments
        SET status = 'FAILED',
            failed_at = NOW(),
            failure_reason = $1
        WHERE id = $2
      `, [paymentResult.message, paymentId]);

      res.status(400).json({
        success: false,
        error: {
          code: paymentResult.error,
          message: paymentResult.message
        }
      });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get payments (filtered by role)
const getPayments = async (req, res) => {
  try {
    const user = req.user;
    const { contractId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT p.*, c.contract_number, c.monthly_rent,
             pr.property_code, pr.neighborhood, pr.district,
             l.first_name as landlord_first_name, l.last_name as landlord_last_name,
             l.company_name as landlord_company, l.is_corporate as landlord_is_corporate,
             t.first_name as tenant_first_name, t.last_name as tenant_last_name,
             t.company_name as tenant_company, t.is_corporate as tenant_is_corporate
      FROM payments p
      JOIN contracts c ON p.contract_id = c.id
      JOIN properties pr ON c.property_id = pr.id
      JOIN users l ON p.landlord_id = l.id
      JOIN users t ON p.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by role
    if (user.role.includes('LANDLORD')) {
      query += ` AND p.landlord_id = $${paramIndex++}`;
      params.push(user.id);
    } else if (user.role.includes('TENANT')) {
      query += ` AND p.tenant_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (contractId) {
      query += ` AND p.contract_id = $${paramIndex++}`;
      params.push(contractId);
    }
    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }
    if (startDate) {
      query += ` AND p.initiated_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND p.initiated_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Count total
    const countQuery = query.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY p.initiated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
        id: p.id,
        paymentReference: p.payment_reference,
        grossAmount: p.gross_amount,
        taxAmount: p.tax_amount,
        netAmount: p.net_amount,
        platformFee: p.platform_fee,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        paymentMethod: p.payment_method,
        status: p.status,
        contract: {
          id: p.contract_id,
          contractNumber: p.contract_number,
          monthlyRent: p.monthly_rent
        },
        property: {
          propertyCode: p.property_code,
          neighborhood: p.neighborhood,
          district: p.district
        },
        landlord: {
          id: p.landlord_id,
          name: p.landlord_is_corporate ? p.landlord_company : `${p.landlord_first_name} ${p.landlord_last_name}`
        },
        tenant: {
          id: p.tenant_id,
          name: p.tenant_is_corporate ? p.tenant_company : `${p.tenant_first_name} ${p.tenant_last_name}`
        },
        initiatedAt: p.initiated_at,
        completedAt: p.completed_at
      })),
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await db.query(`
      SELECT p.*, c.contract_number, c.monthly_rent,
             pr.property_code, pr.digital_address, pr.neighborhood, pr.district,
             l.first_name as landlord_first_name, l.last_name as landlord_last_name,
             l.company_name as landlord_company, l.is_corporate as landlord_is_corporate,
             t.first_name as tenant_first_name, t.last_name as tenant_last_name,
             t.company_name as tenant_company, t.is_corporate as tenant_is_corporate
      FROM payments p
      JOIN contracts c ON p.contract_id = c.id
      JOIN properties pr ON c.property_id = pr.id
      JOIN users l ON p.landlord_id = l.id
      JOIN users t ON p.tenant_id = t.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

    const payment = result.rows[0];

    // Check authorization
    const isLandlord = payment.landlord_id === user.id;
    const isTenant = payment.tenant_id === user.id;
    const isAdmin = user.role === 'SYSTEM_ADMIN' || user.role === 'GRA_OFFICER';

    if (!isLandlord && !isTenant && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this payment'
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        paymentReference: payment.payment_reference,
        grossAmount: payment.gross_amount,
        taxAmount: payment.tax_amount,
        netAmount: payment.net_amount,
        platformFee: payment.platform_fee,
        periodStart: payment.period_start,
        periodEnd: payment.period_end,
        paymentMethod: payment.payment_method,
        providerReference: payment.provider_reference,
        status: payment.status,
        failureReason: payment.failure_reason,
        contract: {
          id: payment.contract_id,
          contractNumber: payment.contract_number,
          monthlyRent: payment.monthly_rent
        },
        property: {
          propertyCode: payment.property_code,
          digitalAddress: payment.digital_address,
          neighborhood: payment.neighborhood,
          district: payment.district
        },
        landlord: {
          id: payment.landlord_id,
          name: payment.landlord_is_corporate ? payment.landlord_company : `${payment.landlord_first_name} ${payment.landlord_last_name}`
        },
        tenant: {
          id: payment.tenant_id,
          name: payment.tenant_is_corporate ? payment.tenant_company : `${payment.tenant_first_name} ${payment.tenant_last_name}`
        },
        initiatedAt: payment.initiated_at,
        completedAt: payment.completed_at,
        failedAt: payment.failed_at,
        settledAt: payment.settled_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get payment summary for landlord
const getPaymentSummary = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { year, month } = req.query;

    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    // Monthly totals
    const monthlyResult = await db.query(`
      SELECT
        COALESCE(SUM(gross_amount), 0) as total_gross,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(net_amount), 0) as total_net,
        COUNT(*) as transaction_count
      FROM payments
      WHERE landlord_id = $1
      AND status = 'COMPLETED'
      AND EXTRACT(YEAR FROM completed_at) = $2
      AND EXTRACT(MONTH FROM completed_at) = $3
    `, [landlordId, currentYear, currentMonth]);

    const monthlyStats = monthlyResult.rows[0];

    // Year to date totals
    const ytdResult = await db.query(`
      SELECT
        COALESCE(SUM(gross_amount), 0) as total_gross,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(net_amount), 0) as total_net,
        COUNT(*) as transaction_count
      FROM payments
      WHERE landlord_id = $1
      AND status = 'COMPLETED'
      AND EXTRACT(YEAR FROM completed_at) = $2
    `, [landlordId, currentYear]);

    const ytdStats = ytdResult.rows[0];

    // Monthly breakdown for the year
    const breakdownResult = await db.query(`
      SELECT
        EXTRACT(MONTH FROM completed_at) as month,
        SUM(gross_amount) as total_gross,
        SUM(tax_amount) as total_tax,
        SUM(net_amount) as total_net,
        COUNT(*) as transaction_count
      FROM payments
      WHERE landlord_id = $1
      AND status = 'COMPLETED'
      AND EXTRACT(YEAR FROM completed_at) = $2
      GROUP BY EXTRACT(MONTH FROM completed_at)
      ORDER BY month
    `, [landlordId, currentYear]);

    res.json({
      success: true,
      data: {
        currentMonth: {
          year: parseInt(currentYear),
          month: parseInt(currentMonth),
          totalGross: parseFloat(monthlyStats?.total_gross) || 0,
          totalTax: parseFloat(monthlyStats?.total_tax) || 0,
          totalNet: parseFloat(monthlyStats?.total_net) || 0,
          transactionCount: parseInt(monthlyStats?.transaction_count) || 0
        },
        yearToDate: {
          year: parseInt(currentYear),
          totalGross: parseFloat(ytdStats?.total_gross) || 0,
          totalTax: parseFloat(ytdStats?.total_tax) || 0,
          totalNet: parseFloat(ytdStats?.total_net) || 0,
          transactionCount: parseInt(ytdStats?.transaction_count) || 0
        },
        monthlyBreakdown: breakdownResult.rows.map(m => ({
          month: parseInt(m.month),
          totalGross: parseFloat(m.total_gross),
          totalTax: parseFloat(m.total_tax),
          totalNet: parseFloat(m.total_net),
          transactionCount: parseInt(m.transaction_count)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  calculateBreakdown,
  initiatePayment,
  getPayments,
  getPaymentById,
  getPaymentSummary
};
