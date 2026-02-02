const { db } = require('../config/database');
const { generateId, generateCertificateNumber, generateVerificationCode } = require('../utils/helpers');

// Get tax certificates
const getCertificates = async (req, res) => {
  try {
    const user = req.user;
    const { year, periodType, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM tax_certificates WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filter by role
    if (user.role.includes('LANDLORD')) {
      query += ` AND landlord_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (year) {
      query += ` AND period_year = $${paramIndex++}`;
      params.push(parseInt(year));
    }
    if (periodType) {
      query += ` AND period_type = $${paramIndex++}`;
      params.push(periodType);
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY period_year DESC, period_month DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(c => ({
        id: c.id,
        certificateNumber: c.certificate_number,
        periodType: c.period_type,
        periodYear: c.period_year,
        periodMonth: c.period_month,
        totalRentReceived: c.total_rent_received,
        totalTaxWithheld: c.total_tax_withheld,
        verificationCode: c.verification_code,
        generatedAt: c.generated_at,
        downloadedAt: c.downloaded_at
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

// Get certificate by ID
const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await db.query(`
      SELECT tc.*, u.first_name, u.last_name, u.company_name, u.is_corporate, u.tin_number
      FROM tax_certificates tc
      JOIN users u ON tc.landlord_id = u.id
      WHERE tc.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Certificate not found'
        }
      });
    }

    const certificate = result.rows[0];

    // Check authorization
    if (certificate.landlord_id !== user.id && !['GRA_OFFICER', 'SYSTEM_ADMIN'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this certificate'
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: certificate.id,
        certificateNumber: certificate.certificate_number,
        periodType: certificate.period_type,
        periodYear: certificate.period_year,
        periodMonth: certificate.period_month,
        totalRentReceived: certificate.total_rent_received,
        totalTaxWithheld: certificate.total_tax_withheld,
        verificationCode: certificate.verification_code,
        qrCodeData: certificate.qr_code_data,
        landlord: {
          id: certificate.landlord_id,
          name: certificate.is_corporate ? certificate.company_name : `${certificate.first_name} ${certificate.last_name}`,
          tinNumber: certificate.tin_number
        },
        generatedAt: certificate.generated_at,
        downloadedAt: certificate.downloaded_at
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

// Generate tax certificate
const generateCertificate = async (req, res) => {
  try {
    const { landlordId, periodType, periodYear, periodMonth } = req.body;

    // Validate
    if (!landlordId || !periodType || !periodYear) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: landlordId, periodType, periodYear'
        }
      });
    }

    if (periodType === 'MONTHLY' && !periodMonth) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Month is required for monthly certificates'
        }
      });
    }

    // Check if certificate already exists
    let existingQuery = 'SELECT * FROM tax_certificates WHERE landlord_id = $1 AND period_type = $2 AND period_year = $3';
    const existingParams = [landlordId, periodType, periodYear];
    if (periodType === 'MONTHLY') {
      existingQuery += ' AND period_month = $4';
      existingParams.push(periodMonth);
    }

    const existingResult = await db.query(existingQuery, existingParams);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'Certificate already exists for this period'
        }
      });
    }

    // Calculate totals from payments
    let paymentQuery = `
      SELECT COALESCE(SUM(gross_amount), 0) as total_rent, COALESCE(SUM(tax_amount), 0) as total_tax
      FROM payments
      WHERE landlord_id = $1 AND status = 'COMPLETED'
      AND EXTRACT(YEAR FROM completed_at) = $2
    `;
    const paymentParams = [landlordId, periodYear];

    if (periodType === 'MONTHLY') {
      paymentQuery += " AND EXTRACT(MONTH FROM completed_at) = $3";
      paymentParams.push(periodMonth);
    }

    const totalsResult = await db.query(paymentQuery, paymentParams);
    const totals = totalsResult.rows[0];

    if (!totals.total_rent || parseFloat(totals.total_rent) === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_PAYMENTS',
          message: 'No payments found for this period'
        }
      });
    }

    // Generate certificate
    const certificateId = generateId();
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();

    // Generate QR code data
    const qrCodeData = JSON.stringify({
      certificateNumber,
      verificationCode,
      landlordId,
      periodType,
      periodYear,
      periodMonth,
      totalTax: totals.total_tax,
      issuedAt: new Date().toISOString()
    });

    await db.query(`
      INSERT INTO tax_certificates (
        id, certificate_number, landlord_id, period_type, period_year, period_month,
        total_rent_received, total_tax_withheld, verification_code, qr_code_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      certificateId,
      certificateNumber,
      landlordId,
      periodType,
      periodYear,
      periodType === 'MONTHLY' ? periodMonth : null,
      totals.total_rent,
      totals.total_tax,
      verificationCode,
      qrCodeData
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: certificateId,
        certificateNumber,
        verificationCode,
        totalRentReceived: parseFloat(totals.total_rent),
        totalTaxWithheld: parseFloat(totals.total_tax),
        message: 'Tax certificate generated successfully'
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

// Verify certificate
const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(`
      SELECT tc.*, u.first_name, u.last_name, u.company_name, u.is_corporate, u.tin_number
      FROM tax_certificates tc
      JOIN users u ON tc.landlord_id = u.id
      WHERE tc.verification_code = $1 OR tc.certificate_number = $1
    `, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Certificate not found'
        }
      });
    }

    const certificate = result.rows[0];

    res.json({
      success: true,
      data: {
        valid: true,
        certificateNumber: certificate.certificate_number,
        periodType: certificate.period_type,
        periodYear: certificate.period_year,
        periodMonth: certificate.period_month,
        totalRentReceived: certificate.total_rent_received,
        totalTaxWithheld: certificate.total_tax_withheld,
        landlord: {
          name: certificate.is_corporate ? certificate.company_name : `${certificate.first_name} ${certificate.last_name}`,
          tinNumber: certificate.tin_number ? certificate.tin_number.substr(0, 3) + '***' : null
        },
        issuedAt: certificate.generated_at
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

// Get tax summary
const getTaxSummary = async (req, res) => {
  try {
    const user = req.user;
    const { year, landlordId } = req.query;

    const targetLandlordId = user.role.includes('LANDLORD') ? user.id : landlordId;
    const targetYear = year || new Date().getFullYear();

    if (!targetLandlordId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Landlord ID is required'
        }
      });
    }

    // Get landlord info
    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [targetLandlordId]);
    if (landlordResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landlord not found'
        }
      });
    }
    const landlord = landlordResult.rows[0];

    // Get yearly totals
    const yearlyResult = await db.query(`
      SELECT COALESCE(SUM(gross_amount), 0) as total_rent, COALESCE(SUM(tax_amount), 0) as total_tax, COUNT(*) as payment_count
      FROM payments
      WHERE landlord_id = $1 AND status = 'COMPLETED' AND EXTRACT(YEAR FROM completed_at) = $2
    `, [targetLandlordId, targetYear]);
    const yearlyTotals = yearlyResult.rows[0];

    // Get monthly breakdown
    const monthlyResult = await db.query(`
      SELECT
        EXTRACT(MONTH FROM completed_at) as month,
        SUM(gross_amount) as total_rent,
        SUM(tax_amount) as total_tax,
        COUNT(*) as payment_count
      FROM payments
      WHERE landlord_id = $1 AND status = 'COMPLETED' AND EXTRACT(YEAR FROM completed_at) = $2
      GROUP BY EXTRACT(MONTH FROM completed_at)
      ORDER BY month
    `, [targetLandlordId, targetYear]);

    // Get certificates for the year
    const certificatesResult = await db.query(`
      SELECT * FROM tax_certificates
      WHERE landlord_id = $1 AND period_year = $2
      ORDER BY period_month
    `, [targetLandlordId, parseInt(targetYear)]);

    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        landlord: {
          id: landlord.id,
          name: landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`,
          tinNumber: landlord.tin_number
        },
        summary: {
          totalRentReceived: parseFloat(yearlyTotals?.total_rent) || 0,
          totalTaxWithheld: parseFloat(yearlyTotals?.total_tax) || 0,
          paymentCount: parseInt(yearlyTotals?.payment_count) || 0,
          effectiveTaxRate: yearlyTotals?.total_rent && parseFloat(yearlyTotals.total_rent) > 0 ?
            ((parseFloat(yearlyTotals.total_tax) / parseFloat(yearlyTotals.total_rent)) * 100).toFixed(2) + '%' : '0%'
        },
        monthlyBreakdown: monthlyResult.rows.map(m => ({
          month: parseInt(m.month),
          totalRent: parseFloat(m.total_rent),
          totalTax: parseFloat(m.total_tax),
          paymentCount: parseInt(m.payment_count)
        })),
        certificates: certificatesResult.rows.map(c => ({
          id: c.id,
          certificateNumber: c.certificate_number,
          periodType: c.period_type,
          periodMonth: c.period_month,
          totalTaxWithheld: c.total_tax_withheld,
          generatedAt: c.generated_at
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

// Download certificate (mark as downloaded)
const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM tax_certificates WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Certificate not found'
        }
      });
    }

    const certificate = result.rows[0];

    // Check authorization
    if (certificate.landlord_id !== req.user.id && !['GRA_OFFICER', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this certificate'
        }
      });
    }

    // Mark as downloaded
    await db.query('UPDATE tax_certificates SET downloaded_at = NOW() WHERE id = $1', [id]);

    // In a real implementation, this would return a PDF
    res.json({
      success: true,
      data: {
        message: 'Certificate download initiated',
        certificateNumber: certificate.certificate_number,
        // In production, this would be a PDF download URL
        downloadUrl: `/api/tax/certificates/${id}/pdf`
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

// Get my tax summary (for landlords)
const getMyTaxSummary = async (req, res) => {
  try {
    const user = req.user;
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    // Get yearly totals
    const yearlyResult = await db.query(`
      SELECT COALESCE(SUM(gross_amount), 0) as total_rent, COALESCE(SUM(tax_amount), 0) as total_tax, COUNT(*) as payment_count
      FROM payments
      WHERE landlord_id = $1 AND status = 'COMPLETED' AND EXTRACT(YEAR FROM completed_at) = $2
    `, [user.id, targetYear]);
    const yearlyTotals = yearlyResult.rows[0];

    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        totalRentReceived: parseFloat(yearlyTotals?.total_rent) || 0,
        totalTaxWithheld: parseFloat(yearlyTotals?.total_tax) || 0,
        paymentCount: parseInt(yearlyTotals?.payment_count) || 0,
        taxRate: 8
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get my tax history
const getMyTaxHistory = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(`
      SELECT
        EXTRACT(YEAR FROM completed_at) as year,
        EXTRACT(MONTH FROM completed_at) as month,
        SUM(gross_amount) as total_rent,
        SUM(tax_amount) as total_tax,
        COUNT(*) as payment_count
      FROM payments
      WHERE landlord_id = $1 AND status = 'COMPLETED'
      GROUP BY EXTRACT(YEAR FROM completed_at), EXTRACT(MONTH FROM completed_at)
      ORDER BY year DESC, month DESC
      LIMIT $2 OFFSET $3
    `, [user.id, parseInt(limit), offset]);

    res.json({
      success: true,
      data: result.rows.map(r => ({
        year: parseInt(r.year),
        month: parseInt(r.month),
        totalRent: parseFloat(r.total_rent),
        totalTax: parseFloat(r.total_tax),
        paymentCount: parseInt(r.payment_count)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get my tax projection
const getMyTaxProjection = async (req, res) => {
  try {
    const user = req.user;
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    // Get active contracts
    const contractsResult = await db.query(`
      SELECT SUM(monthly_rent) as total_monthly_rent
      FROM contracts
      WHERE landlord_id = $1 AND status = 'ACTIVE'
    `, [user.id]);

    const monthlyRent = parseFloat(contractsResult.rows[0]?.total_monthly_rent) || 0;
    const annualProjected = monthlyRent * 12;
    const projectedTax = annualProjected * 0.08;

    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        monthlyRentIncome: monthlyRent,
        projectedAnnualIncome: annualProjected,
        projectedAnnualTax: projectedTax,
        taxRate: 8
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get my compliance status
const getMyCompliance = async (req, res) => {
  try {
    const user = req.user;

    // Get user compliance info
    const userResult = await db.query('SELECT compliance_score, tin_number FROM users WHERE id = $1', [user.id]);
    const userData = userResult.rows[0];

    // Count registered properties
    const propertiesResult = await db.query('SELECT COUNT(*) as count FROM properties WHERE landlord_id = $1', [user.id]);

    // Count active contracts
    const contractsResult = await db.query("SELECT COUNT(*) as count FROM contracts WHERE landlord_id = $1 AND status = 'ACTIVE'", [user.id]);

    res.json({
      success: true,
      data: {
        complianceScore: userData?.compliance_score || 100,
        hasTin: !!userData?.tin_number,
        registeredProperties: parseInt(propertiesResult.rows[0].count),
        activeContracts: parseInt(contractsResult.rows[0].count),
        status: (userData?.compliance_score || 100) >= 80 ? 'COMPLIANT' : 'NEEDS_ATTENTION'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get my certificates
const getMyCertificates = async (req, res) => {
  try {
    const user = req.user;
    const { year, page = 1, limit = 20 } = req.query;

    let query = 'SELECT * FROM tax_certificates WHERE landlord_id = $1';
    const params = [user.id];
    let paramIndex = 2;

    if (year) {
      query += ` AND period_year = $${paramIndex++}`;
      params.push(parseInt(year));
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY period_year DESC, period_month DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(c => ({
        id: c.id,
        certificateNumber: c.certificate_number,
        periodType: c.period_type,
        periodYear: c.period_year,
        periodMonth: c.period_month,
        totalRentReceived: c.total_rent_received,
        totalTaxWithheld: c.total_tax_withheld,
        verificationCode: c.verification_code,
        generatedAt: c.generated_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Calculate tax
const calculateTax = async (req, res) => {
  try {
    const { grossAmount } = req.body;

    if (!grossAmount || grossAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Valid gross amount is required' }
      });
    }

    const taxRate = 0.08; // 8%
    const taxAmount = grossAmount * taxRate;
    const netAmount = grossAmount - taxAmount;

    res.json({
      success: true,
      data: {
        grossAmount,
        taxRate: taxRate * 100,
        taxAmount,
        netAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Request certificate
const requestCertificate = async (req, res) => {
  try {
    const user = req.user;
    const { periodType, periodYear, periodMonth } = req.body;

    // Validate
    if (!periodType || !periodYear) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Period type and year are required' }
      });
    }

    // Check if payments exist for this period
    let paymentQuery = `
      SELECT COALESCE(SUM(gross_amount), 0) as total_rent, COALESCE(SUM(tax_amount), 0) as total_tax
      FROM payments
      WHERE landlord_id = $1 AND status = 'COMPLETED'
      AND EXTRACT(YEAR FROM completed_at) = $2
    `;
    const params = [user.id, periodYear];

    if (periodType === 'MONTHLY' && periodMonth) {
      paymentQuery += ' AND EXTRACT(MONTH FROM completed_at) = $3';
      params.push(periodMonth);
    }

    const totalsResult = await db.query(paymentQuery, params);
    const totals = totalsResult.rows[0];

    if (!totals.total_rent || parseFloat(totals.total_rent) === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_PAYMENTS', message: 'No payments found for this period' }
      });
    }

    // Generate certificate
    const certificateId = generateId();
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();

    await db.query(`
      INSERT INTO tax_certificates (
        id, certificate_number, landlord_id, period_type, period_year, period_month,
        total_rent_received, total_tax_withheld, verification_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      certificateId, certificateNumber, user.id, periodType, periodYear,
      periodType === 'MONTHLY' ? periodMonth : null,
      totals.total_rent, totals.total_tax, verificationCode
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: certificateId,
        certificateNumber,
        verificationCode,
        message: 'Certificate request submitted successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get tax statistics (GRA)
const getTaxStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const result = await db.query(`
      SELECT
        COALESCE(SUM(gross_amount), 0) as total_rent,
        COALESCE(SUM(tax_amount), 0) as total_tax,
        COUNT(*) as payment_count,
        COUNT(DISTINCT landlord_id) as landlord_count
      FROM payments
      WHERE status = 'COMPLETED' AND EXTRACT(YEAR FROM completed_at) = $1
    `, [targetYear]);

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        totalRentCollected: parseFloat(stats.total_rent) || 0,
        totalTaxCollected: parseFloat(stats.total_tax) || 0,
        paymentCount: parseInt(stats.payment_count) || 0,
        activeLandlords: parseInt(stats.landlord_count) || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get collection summary (GRA)
const getCollectionSummary = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const monthlyResult = await db.query(`
      SELECT
        EXTRACT(MONTH FROM completed_at) as month,
        SUM(gross_amount) as total_rent,
        SUM(tax_amount) as total_tax,
        COUNT(*) as payment_count
      FROM payments
      WHERE status = 'COMPLETED' AND EXTRACT(YEAR FROM completed_at) = $1
      GROUP BY EXTRACT(MONTH FROM completed_at)
      ORDER BY month
    `, [targetYear]);

    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        monthlyCollection: monthlyResult.rows.map(r => ({
          month: parseInt(r.month),
          totalRent: parseFloat(r.total_rent),
          totalTax: parseFloat(r.total_tax),
          paymentCount: parseInt(r.payment_count)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get landlord records (GRA)
const getLandlordRecords = async (req, res) => {
  try {
    const { tin, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT u.*,
             COALESCE(SUM(p.gross_amount), 0) as total_rent,
             COALESCE(SUM(p.tax_amount), 0) as total_tax,
             COUNT(DISTINCT p.id) as payment_count
      FROM users u
      LEFT JOIN payments p ON u.id = p.landlord_id AND p.status = 'COMPLETED'
      WHERE u.role IN ('LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE')
    `;
    const params = [];
    let paramIndex = 1;

    if (tin) {
      query += ` AND u.tin_number ILIKE $${paramIndex++}`;
      params.push(`%${tin}%`);
    }

    query += ' GROUP BY u.id ORDER BY total_tax DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(r => ({
        id: r.id,
        name: r.is_corporate ? r.company_name : `${r.first_name} ${r.last_name}`,
        email: r.email,
        phone: r.phone,
        tinNumber: r.tin_number,
        isCorporate: r.is_corporate,
        totalRent: parseFloat(r.total_rent) || 0,
        totalTax: parseFloat(r.total_tax) || 0,
        paymentCount: parseInt(r.payment_count) || 0
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get landlord tax details (GRA)
const getLandlordTaxDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (landlordResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Landlord not found' }
      });
    }

    const landlord = landlordResult.rows[0];

    // Get payments
    const paymentsResult = await db.query(`
      SELECT * FROM payments WHERE landlord_id = $1 AND status = 'COMPLETED'
      ORDER BY completed_at DESC LIMIT 20
    `, [id]);

    // Get certificates
    const certsResult = await db.query(`
      SELECT * FROM tax_certificates WHERE landlord_id = $1
      ORDER BY period_year DESC, period_month DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        landlord: {
          id: landlord.id,
          name: landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`,
          email: landlord.email,
          tinNumber: landlord.tin_number,
          complianceScore: landlord.compliance_score
        },
        recentPayments: paymentsResult.rows.map(p => ({
          id: p.id,
          grossAmount: p.gross_amount,
          taxAmount: p.tax_amount,
          completedAt: p.completed_at
        })),
        certificates: certsResult.rows.map(c => ({
          id: c.id,
          certificateNumber: c.certificate_number,
          periodYear: c.period_year,
          periodMonth: c.period_month,
          totalTax: c.total_tax_withheld
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get collection report
const getCollectionReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();

    const result = await db.query(`
      SELECT
        p.region,
        COUNT(*) as payment_count,
        SUM(p.gross_amount) as total_rent,
        SUM(p.tax_amount) as total_tax
      FROM payments pay
      JOIN contracts c ON pay.contract_id = c.id
      JOIN properties p ON c.property_id = p.id
      WHERE pay.status = 'COMPLETED' AND EXTRACT(YEAR FROM pay.completed_at) = $1
      GROUP BY p.region
      ORDER BY total_tax DESC
    `, [targetYear]);

    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        byRegion: result.rows.map(r => ({
          region: r.region,
          paymentCount: parseInt(r.payment_count),
          totalRent: parseFloat(r.total_rent),
          totalTax: parseFloat(r.total_tax)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get compliance report
const getComplianceReport = async (req, res) => {
  try {
    const { year } = req.query;

    // Get compliance stats
    const result = await db.query(`
      SELECT
        CASE
          WHEN compliance_score >= 90 THEN 'EXCELLENT'
          WHEN compliance_score >= 70 THEN 'GOOD'
          WHEN compliance_score >= 50 THEN 'FAIR'
          ELSE 'POOR'
        END as category,
        COUNT(*) as count
      FROM users
      WHERE role IN ('LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE')
      GROUP BY category
    `);

    const tinResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE tin_number IS NOT NULL) as with_tin,
        COUNT(*) FILTER (WHERE tin_number IS NULL) as without_tin
      FROM users
      WHERE role IN ('LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE')
    `);

    res.json({
      success: true,
      data: {
        complianceDistribution: result.rows.reduce((acc, r) => {
          acc[r.category] = parseInt(r.count);
          return acc;
        }, {}),
        tinStatus: {
          withTin: parseInt(tinResult.rows[0]?.with_tin) || 0,
          withoutTin: parseInt(tinResult.rows[0]?.without_tin) || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

module.exports = {
  getCertificates,
  getCertificateById,
  generateCertificate,
  verifyCertificate,
  getTaxSummary,
  downloadCertificate,
  getMyTaxSummary,
  getMyTaxHistory,
  getMyTaxProjection,
  getMyCompliance,
  getMyCertificates,
  calculateTax,
  requestCertificate,
  getTaxStatistics,
  getCollectionSummary,
  getLandlordRecords,
  getLandlordTaxDetails,
  getCollectionReport,
  getComplianceReport
};
