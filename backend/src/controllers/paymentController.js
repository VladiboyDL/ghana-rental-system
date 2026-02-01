const db = require('../config/database');
const {
  generateId,
  generatePaymentReference,
  calculatePaymentBreakdown
} = require('../utils/helpers');
const { processPayment } = require('../simulators/mobileMoney');
const { sendPaymentReceipt, sendLandlordPaymentNotification } = require('../simulators/sms');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

// Calculate payment breakdown
const calculateBreakdown = (req, res) => {
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
    const contract = db.prepare(`
      SELECT c.*, u.* FROM contracts c
      JOIN users u ON c.landlord_id = u.id
      WHERE c.id = ?
    `).get(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

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
    const contract = db.prepare(`
      SELECT c.*, p.neighborhood, p.district
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      WHERE c.id = ?
    `).get(contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

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

    // Get landlord
    const landlord = db.prepare('SELECT * FROM users WHERE id = ?').get(contract.landlord_id);
    const tenant = db.prepare('SELECT * FROM users WHERE id = ?').get(tenantId);

    // Calculate payment breakdown
    const breakdown = calculatePaymentBreakdown(amount, landlord, contract);

    // Create payment record
    const paymentId = generateId();
    const paymentReference = generatePaymentReference();

    db.prepare(`
      INSERT INTO payments (
        id, payment_reference, contract_id, tenant_id, landlord_id,
        gross_amount, tax_amount, net_amount, platform_fee,
        period_start, period_end, payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROCESSING')
    `).run(
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
    );

    // Process payment (simulated)
    const paymentResult = await processPayment({
      amount: breakdown.grossAmount,
      provider: paymentMethod,
      phoneNumber: phoneNumber || tenant.phone,
      reference: paymentReference
    });

    if (paymentResult.success) {
      // Update payment status
      db.prepare(`
        UPDATE payments
        SET status = 'COMPLETED',
            provider_reference = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).run(paymentResult.data.providerReference, paymentId);

      // Update contract total tax withheld
      db.prepare(`
        UPDATE contracts
        SET total_tax_withheld = total_tax_withheld + ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(breakdown.taxAmount, contractId);

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
      db.prepare(`
        UPDATE payments
        SET status = 'FAILED',
            failed_at = datetime('now'),
            failure_reason = ?
        WHERE id = ?
      `).run(paymentResult.message, paymentId);

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
const getPayments = (req, res) => {
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

    // Filter by role
    if (user.role.includes('LANDLORD')) {
      query += ' AND p.landlord_id = ?';
      params.push(user.id);
    } else if (user.role.includes('TENANT')) {
      query += ' AND p.tenant_id = ?';
      params.push(user.id);
    }

    if (contractId) {
      query += ' AND p.contract_id = ?';
      params.push(contractId);
    }
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }
    if (startDate) {
      query += ' AND p.initiated_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND p.initiated_at <= ?';
      params.push(endDate);
    }

    // Count total
    const countQuery = query.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = db.prepare(countQuery).get(...params);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY p.initiated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const payments = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: payments.map(p => ({
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
const getPaymentById = (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const payment = db.prepare(`
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
      WHERE p.id = ?
    `).get(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found'
        }
      });
    }

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
const getPaymentSummary = (req, res) => {
  try {
    const landlordId = req.user.id;
    const { year, month } = req.query;

    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    // Monthly totals
    const monthlyStats = db.prepare(`
      SELECT
        SUM(gross_amount) as total_gross,
        SUM(tax_amount) as total_tax,
        SUM(net_amount) as total_net,
        COUNT(*) as transaction_count
      FROM payments
      WHERE landlord_id = ?
      AND status = 'COMPLETED'
      AND strftime('%Y', completed_at) = ?
      AND strftime('%m', completed_at) = ?
    `).get(landlordId, String(currentYear), String(currentMonth).padStart(2, '0'));

    // Year to date totals
    const ytdStats = db.prepare(`
      SELECT
        SUM(gross_amount) as total_gross,
        SUM(tax_amount) as total_tax,
        SUM(net_amount) as total_net,
        COUNT(*) as transaction_count
      FROM payments
      WHERE landlord_id = ?
      AND status = 'COMPLETED'
      AND strftime('%Y', completed_at) = ?
    `).get(landlordId, String(currentYear));

    // Monthly breakdown for the year
    const monthlyBreakdown = db.prepare(`
      SELECT
        strftime('%m', completed_at) as month,
        SUM(gross_amount) as total_gross,
        SUM(tax_amount) as total_tax,
        SUM(net_amount) as total_net,
        COUNT(*) as transaction_count
      FROM payments
      WHERE landlord_id = ?
      AND status = 'COMPLETED'
      AND strftime('%Y', completed_at) = ?
      GROUP BY strftime('%m', completed_at)
      ORDER BY month
    `).all(landlordId, String(currentYear));

    res.json({
      success: true,
      data: {
        currentMonth: {
          year: parseInt(currentYear),
          month: parseInt(currentMonth),
          totalGross: monthlyStats?.total_gross || 0,
          totalTax: monthlyStats?.total_tax || 0,
          totalNet: monthlyStats?.total_net || 0,
          transactionCount: monthlyStats?.transaction_count || 0
        },
        yearToDate: {
          year: parseInt(currentYear),
          totalGross: ytdStats?.total_gross || 0,
          totalTax: ytdStats?.total_tax || 0,
          totalNet: ytdStats?.total_net || 0,
          transactionCount: ytdStats?.transaction_count || 0
        },
        monthlyBreakdown: monthlyBreakdown.map(m => ({
          month: parseInt(m.month),
          totalGross: m.total_gross,
          totalTax: m.total_tax,
          totalNet: m.total_net,
          transactionCount: m.transaction_count
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
