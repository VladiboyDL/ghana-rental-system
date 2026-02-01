const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Dashboard stats
router.get('/dashboard', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), (req, res) => {
  try {
    const stats = {};

    // User stats
    stats.users = {
      total: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      landlords: db.prepare("SELECT COUNT(*) as count FROM users WHERE role LIKE 'LANDLORD%'").get().count,
      tenants: db.prepare("SELECT COUNT(*) as count FROM users WHERE role LIKE 'TENANT%'").get().count,
      active: db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'ACTIVE'").get().count
    };

    // Property stats
    stats.properties = {
      total: db.prepare('SELECT COUNT(*) as count FROM properties').get().count,
      verified: db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'VERIFIED'").get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'PENDING_VERIFICATION'").get().count
    };

    // Contract stats
    stats.contracts = {
      total: db.prepare('SELECT COUNT(*) as count FROM contracts').get().count,
      active: db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'ACTIVE'").get().count,
      pending: db.prepare("SELECT COUNT(*) as count FROM contracts WHERE status = 'PENDING_TENANT_CONFIRMATION'").get().count
    };

    // Payment stats
    const paymentStats = db.prepare(`
      SELECT
        COUNT(*) as total_count,
        SUM(gross_amount) as total_gross,
        SUM(tax_amount) as total_tax,
        SUM(net_amount) as total_net
      FROM payments WHERE status = 'COMPLETED'
    `).get();

    stats.payments = {
      totalCount: paymentStats.total_count || 0,
      totalGross: paymentStats.total_gross || 0,
      totalTax: paymentStats.total_tax || 0,
      totalNet: paymentStats.total_net || 0
    };

    // Today's stats
    const todayStats = db.prepare(`
      SELECT
        COUNT(*) as count,
        SUM(tax_amount) as tax
      FROM payments
      WHERE status = 'COMPLETED' AND DATE(completed_at) = DATE('now')
    `).get();

    stats.today = {
      transactions: todayStats.count || 0,
      taxCollected: todayStats.tax || 0
    };

    // Case stats
    stats.cases = {
      open: db.prepare("SELECT COUNT(*) as count FROM inspection_cases WHERE status IN ('OPEN', 'ASSIGNED')").get().count,
      inProgress: db.prepare("SELECT COUNT(*) as count FROM inspection_cases WHERE status = 'IN_PROGRESS'").get().count,
      closed: db.prepare("SELECT COUNT(*) as count FROM inspection_cases WHERE status = 'CLOSED'").get().count
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
router.get('/reports', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), (req, res) => {
  try {
    const { type, startDate, endDate, region, district } = req.query;

    let data = {};

    switch (type) {
      case 'tax_collection':
        const taxData = db.prepare(`
          SELECT
            strftime('%Y-%m', completed_at) as period,
            COUNT(*) as transaction_count,
            SUM(gross_amount) as total_rent,
            SUM(tax_amount) as total_tax
          FROM payments
          WHERE status = 'COMPLETED'
          ${startDate ? "AND completed_at >= ?" : ""}
          ${endDate ? "AND completed_at <= ?" : ""}
          GROUP BY strftime('%Y-%m', completed_at)
          ORDER BY period DESC
        `).all(...[startDate, endDate].filter(Boolean));
        data = taxData;
        break;

      case 'compliance':
        data = db.prepare(`
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
        `).all();
        break;

      case 'registrations':
        data = db.prepare(`
          SELECT
            DATE(created_at) as date,
            COUNT(CASE WHEN role LIKE 'LANDLORD%' THEN 1 END) as landlords,
            COUNT(CASE WHEN role LIKE 'TENANT%' THEN 1 END) as tenants,
            COUNT(*) as total
          FROM users
          ${startDate ? "WHERE created_at >= ?" : ""}
          ${endDate ? (startDate ? "AND" : "WHERE") + " created_at <= ?" : ""}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `).all(...[startDate, endDate].filter(Boolean));
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
router.get('/audit-logs', authenticate, authorize(ROLES.SYSTEM_ADMIN), (req, res) => {
  try {
    const { userId, action, resourceType, page = 1, limit = 50 } = req.query;

    let query = `
      SELECT al.*, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }
    if (resourceType) {
      query += ' AND al.resource_type = ?';
      params.push(resourceType);
    }

    const countQuery = query.replace('SELECT al.*, u.email as user_email', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const logs = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: logs,
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

module.exports = router;
