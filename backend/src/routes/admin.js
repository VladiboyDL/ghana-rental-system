const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Dashboard stats
router.get('/dashboard', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), async (req, res) => {
  try {
    const stats = {};

    // User stats
    const totalUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const landlordCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role LIKE 'LANDLORD%'");
    const tenantCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role LIKE 'TENANT%'");
    const activeUsers = await db.query("SELECT COUNT(*) as count FROM users WHERE status = 'ACTIVE'");

    stats.users = {
      total: parseInt(totalUsers.rows[0].count),
      landlords: parseInt(landlordCount.rows[0].count),
      tenants: parseInt(tenantCount.rows[0].count),
      active: parseInt(activeUsers.rows[0].count)
    };

    // Property stats
    const totalProperties = await db.query('SELECT COUNT(*) as count FROM properties');
    const verifiedProperties = await db.query("SELECT COUNT(*) as count FROM properties WHERE status = 'VERIFIED'");
    const pendingProperties = await db.query("SELECT COUNT(*) as count FROM properties WHERE status = 'PENDING_VERIFICATION'");

    stats.properties = {
      total: parseInt(totalProperties.rows[0].count),
      verified: parseInt(verifiedProperties.rows[0].count),
      pending: parseInt(pendingProperties.rows[0].count)
    };

    // Contract stats
    const totalContracts = await db.query('SELECT COUNT(*) as count FROM contracts');
    const activeContracts = await db.query("SELECT COUNT(*) as count FROM contracts WHERE status = 'ACTIVE'");
    const pendingContracts = await db.query("SELECT COUNT(*) as count FROM contracts WHERE status = 'PENDING_TENANT_CONFIRMATION'");

    stats.contracts = {
      total: parseInt(totalContracts.rows[0].count),
      active: parseInt(activeContracts.rows[0].count),
      pending: parseInt(pendingContracts.rows[0].count)
    };

    // Payment stats
    const paymentStats = await db.query(`
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(gross_amount), 0) as total_gross,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COALESCE(SUM(net_amount), 0) as total_net
      FROM payments WHERE status = 'COMPLETED'
    `);

    stats.payments = {
      totalCount: parseInt(paymentStats.rows[0].total_count) || 0,
      totalGross: parseFloat(paymentStats.rows[0].total_gross) || 0,
      totalTax: parseFloat(paymentStats.rows[0].total_tax) || 0,
      totalNet: parseFloat(paymentStats.rows[0].total_net) || 0
    };

    // Today's stats
    const todayStats = await db.query(`
      SELECT
        COUNT(*) as count,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM payments
      WHERE status = 'COMPLETED' AND DATE(completed_at) = CURRENT_DATE
    `);

    stats.today = {
      transactions: parseInt(todayStats.rows[0].count) || 0,
      taxCollected: parseFloat(todayStats.rows[0].tax) || 0
    };

    // Case stats
    const openCases = await db.query("SELECT COUNT(*) as count FROM inspection_cases WHERE status IN ('OPEN', 'ASSIGNED')");
    const inProgressCases = await db.query("SELECT COUNT(*) as count FROM inspection_cases WHERE status = 'IN_PROGRESS'");
    const closedCases = await db.query("SELECT COUNT(*) as count FROM inspection_cases WHERE status = 'CLOSED'");

    stats.cases = {
      open: parseInt(openCases.rows[0].count),
      inProgress: parseInt(inProgressCases.rows[0].count),
      closed: parseInt(closedCases.rows[0].count)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
});

// Generate reports
router.get('/reports', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), async (req, res) => {
  try {
    const { type, startDate, endDate, region, district } = req.query;

    let data = {};

    switch (type) {
      case 'tax_collection':
        let taxQuery = `
          SELECT
            TO_CHAR(completed_at, 'YYYY-MM') as period,
            COUNT(*) as transaction_count,
            SUM(gross_amount) as total_rent,
            SUM(tax_amount) as total_tax
          FROM payments
          WHERE status = 'COMPLETED'
        `;
        const taxParams = [];
        let paramIndex = 1;

        if (startDate) {
          taxQuery += ` AND completed_at >= $${paramIndex}`;
          taxParams.push(startDate);
          paramIndex++;
        }
        if (endDate) {
          taxQuery += ` AND completed_at <= $${paramIndex}`;
          taxParams.push(endDate);
          paramIndex++;
        }

        taxQuery += ` GROUP BY TO_CHAR(completed_at, 'YYYY-MM') ORDER BY period DESC`;

        const taxResult = await db.query(taxQuery, taxParams);
        data = taxResult.rows;
        break;

      case 'compliance':
        const complianceResult = await db.query(`
          SELECT
            region,
            COUNT(*) as landlord_count,
            AVG(compliance_score) as avg_score,
            SUM(CASE WHEN compliance_score >= 90 THEN 1 ELSE 0 END) as gold,
            SUM(CASE WHEN compliance_score >= 75 AND compliance_score < 90 THEN 1 ELSE 0 END) as silver,
            SUM(CASE WHEN compliance_score < 60 THEN 1 ELSE 0 END) as non_compliant
          FROM users
          WHERE role LIKE 'LANDLORD%' AND status = 'ACTIVE'
          GROUP BY region
        `);
        data = complianceResult.rows;
        break;

      case 'registrations':
        let regQuery = `
          SELECT
            DATE(created_at) as date,
            COUNT(CASE WHEN role LIKE 'LANDLORD%' THEN 1 END) as landlords,
            COUNT(CASE WHEN role LIKE 'TENANT%' THEN 1 END) as tenants,
            COUNT(*) as total
          FROM users
        `;
        const regParams = [];
        let regParamIndex = 1;

        if (startDate) {
          regQuery += ` WHERE created_at >= $${regParamIndex}`;
          regParams.push(startDate);
          regParamIndex++;
        }
        if (endDate) {
          regQuery += startDate ? ' AND' : ' WHERE';
          regQuery += ` created_at <= $${regParamIndex}`;
          regParams.push(endDate);
        }

        regQuery += ` GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`;

        const regResult = await db.query(regQuery, regParams);
        data = regResult.rows;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REPORT', message: 'Invalid report type' }
        });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
});

// Audit logs
router.get('/audit-logs', authenticate, authorize(ROLES.SYSTEM_ADMIN), async (req, res) => {
  try {
    const { userId, action, resourceType, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT al.*, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    if (action) {
      query += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }
    if (resourceType) {
      query += ` AND al.resource_type = $${paramIndex}`;
      params.push(resourceType);
      paramIndex++;
    }

    const countQuery = query.replace('SELECT al.*, u.email as user_email', 'SELECT COUNT(*) as total');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const logsResult = await db.query(query, params);

    res.json({
      success: true,
      data: logsResult.rows,
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
      error: { code: 'ERROR', message: error.message }
    });
  }
});

// SMS log (for demo)
router.get('/sms-log', authenticate, authorize(ROLES.SYSTEM_ADMIN), (req, res) => {
  const { getSMSLog } = require('../simulators/sms');
  res.json({
    success: true,
    data: getSMSLog()
  });
});

// Clean up test contracts - keep only one active per tenant
router.post('/cleanup-test-contracts', authenticate, authorize(ROLES.SYSTEM_ADMIN), async (req, res) => {
  try {
    const { tenantId, keepContractId } = req.body;

    if (!tenantId || !keepContractId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'tenantId and keepContractId are required' }
      });
    }

    // Get all contracts for this tenant except the one to keep
    const contractsToTerminate = await db.query(`
      SELECT id, contract_number FROM contracts
      WHERE tenant_id = $1 AND id != $2
    `, [tenantId, keepContractId]);

    // Terminate (not delete) other contracts - set them to TERMINATED status
    const result = await db.query(`
      UPDATE contracts
      SET status = 'TERMINATED',
          termination_reason = 'Test data cleanup',
          terminated_at = NOW(),
          updated_at = NOW()
      WHERE tenant_id = $1 AND id != $2
      RETURNING id, contract_number
    `, [tenantId, keepContractId]);

    res.json({
      success: true,
      data: {
        message: 'Test contracts cleaned up',
        terminatedCount: result.rowCount,
        terminatedContracts: result.rows.map(c => c.contract_number),
        keptContractId: keepContractId
      }
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
});

// Fix data consistency - Admin only
router.post('/fix-data-consistency', authenticate, authorize(ROLES.SYSTEM_ADMIN), async (req, res) => {
  try {
    console.log('Starting data consistency fix...');

    // Update contract dates to be current/realistic
    // Contract 1: Active, started 6 months ago
    await db.query(`
      UPDATE contracts
      SET start_date = CURRENT_DATE - INTERVAL '6 months',
          end_date = CURRENT_DATE + INTERVAL '18 months',
          landlord_signed_at = CURRENT_DATE - INTERVAL '6 months' - INTERVAL '10 days',
          tenant_confirmed_at = CURRENT_DATE - INTERVAL '6 months' - INTERVAL '9 days',
          updated_at = NOW()
      WHERE contract_number = 'CTR-2024-0001'
    `);

    // Contract 2: Active, started 3 months ago
    await db.query(`
      UPDATE contracts
      SET start_date = CURRENT_DATE - INTERVAL '3 months',
          end_date = CURRENT_DATE + INTERVAL '9 months',
          landlord_signed_at = CURRENT_DATE - INTERVAL '3 months' - INTERVAL '10 days',
          tenant_confirmed_at = CURRENT_DATE - INTERVAL '3 months' - INTERVAL '9 days',
          updated_at = NOW()
      WHERE contract_number = 'CTR-2024-0002'
    `);

    // Contract 3: Pending, starts next month
    await db.query(`
      UPDATE contracts
      SET start_date = CURRENT_DATE + INTERVAL '1 month',
          end_date = CURRENT_DATE + INTERVAL '13 months',
          landlord_signed_at = CURRENT_DATE - INTERVAL '5 days',
          updated_at = NOW()
      WHERE contract_number = 'CTR-2024-0003'
    `);

    console.log('Contracts updated');

    // Delete old payments
    await db.query('DELETE FROM payments');
    console.log('Old payments deleted');

    // Get contracts for payment generation
    const contractsResult = await db.query(`
      SELECT id, contract_number, landlord_id, tenant_id, monthly_rent, start_date
      FROM contracts
      WHERE status = 'ACTIVE'
      ORDER BY contract_number
    `);

    const contracts = contractsResult.rows;
    let totalPayments = 0;

    for (const contract of contracts) {
      const startDate = new Date(contract.start_date);
      const now = new Date();
      const grossAmount = parseFloat(contract.monthly_rent);
      const taxAmount = grossAmount * 0.08;
      const netAmount = grossAmount - taxAmount - (grossAmount * 0.01);
      const platformFee = grossAmount * 0.01;

      let paymentDate = new Date(startDate);
      let paymentNum = 1;

      while (paymentDate < now) {
        const periodStart = new Date(paymentDate);
        const periodEnd = new Date(paymentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);

        const completedAt = new Date(periodStart);
        completedAt.setDate(completedAt.getDate() + 3);

        const settledAt = new Date(completedAt);
        settledAt.setDate(settledAt.getDate() + 1);

        const paymentRef = `PAY-2026-${String(totalPayments + 1).padStart(4, '0')}`;

        await db.query(`
          INSERT INTO payments (
            payment_reference, contract_id, tenant_id, landlord_id,
            gross_amount, tax_amount, net_amount, platform_fee,
            period_start, period_end,
            payment_method, payment_provider,
            status, completed_at, settled_at, initiated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $14)
        `, [
          paymentRef,
          contract.id,
          contract.tenant_id,
          contract.landlord_id,
          grossAmount,
          taxAmount,
          netAmount,
          platformFee,
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0],
          'MOBILE_MONEY',
          paymentNum % 2 === 0 ? 'MTN' : 'VODAFONE',
          'COMPLETED',
          completedAt.toISOString(),
          settledAt.toISOString()
        ]);

        paymentDate.setMonth(paymentDate.getMonth() + 1);
        paymentNum++;
        totalPayments++;
      }
    }

    console.log(`Generated ${totalPayments} payments`);

    // Update market rent data to current period
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    await db.query(`
      UPDATE market_rent_data
      SET period_year = $1,
          period_month = $2,
          calculated_at = NOW()
    `, [currentYear, currentMonth]);

    console.log('Market data updated');

    res.json({
      success: true,
      data: {
        message: 'Data consistency fix completed',
        contractsUpdated: contracts.length,
        paymentsGenerated: totalPayments
      }
    });
  } catch (error) {
    console.error('Fix failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
});

module.exports = router;
