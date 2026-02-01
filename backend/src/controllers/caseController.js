const { db } = require('../config/database');
const { generateId, generateCaseNumber } = require('../utils/helpers');
const { sendSMS } = require('../simulators/sms');
const { CASE_TYPES, CASE_STATUS, CASE_PRIORITY } = require('../config/constants');

// Get cases (filtered by role)
const getCases = async (req, res) => {
  try {
    const user = req.user;
    const { status, priority, caseType, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT ic.*,
             p.property_code, p.digital_address, p.neighborhood, p.district, p.region,
             u.first_name as inspector_first_name, u.last_name as inspector_last_name
      FROM inspection_cases ic
      JOIN properties p ON ic.property_id = p.id
      LEFT JOIN users u ON ic.assigned_inspector_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by role
    if (user.role === 'INSPECTOR') {
      query += ` AND ic.assigned_inspector_id = $${paramIndex++}`;
      params.push(user.id);
    } else if (user.role === 'DISTRICT_OFFICER') {
      query += ` AND p.district = $${paramIndex++}`;
      params.push(user.district);
    }

    if (status) {
      query += ` AND ic.status = $${paramIndex++}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND ic.priority = $${paramIndex++}`;
      params.push(priority);
    }
    if (caseType) {
      query += ` AND ic.case_type = $${paramIndex++}`;
      params.push(caseType);
    }

    // Count total
    const countQuery = query.replace(/SELECT ic\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY ic.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(c => ({
        id: c.id,
        caseNumber: c.case_number,
        caseType: c.case_type,
        priority: c.priority,
        riskScore: c.risk_score,
        status: c.status,
        source: c.source,
        description: c.description,
        scheduledDate: c.scheduled_date,
        property: {
          id: c.property_id,
          propertyCode: c.property_code,
          digitalAddress: c.digital_address,
          neighborhood: c.neighborhood,
          district: c.district,
          region: c.region
        },
        inspector: c.assigned_inspector_id ? {
          id: c.assigned_inspector_id,
          name: `${c.inspector_first_name} ${c.inspector_last_name}`
        } : null,
        createdAt: c.created_at
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

// Get case by ID
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT ic.*,
             p.*, p.id as prop_id,
             l.first_name as landlord_first_name, l.last_name as landlord_last_name,
             l.company_name as landlord_company, l.is_corporate as landlord_is_corporate,
             l.phone as landlord_phone,
             u.first_name as inspector_first_name, u.last_name as inspector_last_name,
             u.phone as inspector_phone
      FROM inspection_cases ic
      JOIN properties p ON ic.property_id = p.id
      JOIN users l ON p.landlord_id = l.id
      LEFT JOIN users u ON ic.assigned_inspector_id = u.id
      WHERE ic.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Case not found'
        }
      });
    }

    const caseData = result.rows[0];

    // Get related contracts
    const contractsResult = await db.query(`
      SELECT c.contract_number, c.monthly_rent, c.status, c.start_date, c.end_date
      FROM contracts c
      WHERE c.property_id = $1
      ORDER BY c.created_at DESC
    `, [caseData.property_id]);

    res.json({
      success: true,
      data: {
        id: caseData.id,
        caseNumber: caseData.case_number,
        caseType: caseData.case_type,
        priority: caseData.priority,
        riskScore: caseData.risk_score,
        source: caseData.source,
        sourceReference: caseData.source_reference,
        description: caseData.description,
        allegations: typeof caseData.allegations === 'string' ? JSON.parse(caseData.allegations || '[]') : (caseData.allegations || []),
        status: caseData.status,
        scheduledDate: caseData.scheduled_date,
        inspectionDate: caseData.inspection_date,
        inspectionNotes: caseData.inspection_notes,
        evidence: typeof caseData.evidence === 'string' ? JSON.parse(caseData.evidence || '[]') : (caseData.evidence || []),
        outcome: caseData.outcome,
        outcomeNotes: caseData.outcome_notes,
        penaltyAmount: caseData.penalty_amount,
        property: {
          id: caseData.property_id,
          propertyCode: caseData.property_code,
          digitalAddress: caseData.digital_address,
          region: caseData.region,
          district: caseData.district,
          neighborhood: caseData.neighborhood,
          propertyType: caseData.property_type,
          gpsLatitude: caseData.gps_latitude,
          gpsLongitude: caseData.gps_longitude
        },
        landlord: {
          id: caseData.landlord_id,
          name: caseData.landlord_is_corporate ? caseData.landlord_company : `${caseData.landlord_first_name} ${caseData.landlord_last_name}`,
          phone: caseData.landlord_phone
        },
        inspector: caseData.assigned_inspector_id ? {
          id: caseData.assigned_inspector_id,
          name: `${caseData.inspector_first_name} ${caseData.inspector_last_name}`,
          phone: caseData.inspector_phone
        } : null,
        contracts: contractsResult.rows,
        createdAt: caseData.created_at,
        assignedAt: caseData.assigned_at,
        completedAt: caseData.completed_at,
        closedAt: caseData.closed_at
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

// Create case
const createCase = async (req, res) => {
  try {
    const { propertyId, caseType, priority, source, description, allegations } = req.body;

    if (!propertyId || !caseType || !source) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: propertyId, caseType, source'
        }
      });
    }

    // Validate case type
    if (!Object.values(CASE_TYPES).includes(caseType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CASE_TYPE',
          message: 'Invalid case type'
        }
      });
    }

    // Check property exists
    const propertyResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROPERTY_NOT_FOUND',
          message: 'Property not found'
        }
      });
    }

    const caseId = generateId();
    const caseNumber = generateCaseNumber();

    await db.query(`
      INSERT INTO inspection_cases (
        id, case_number, property_id, case_type, priority, source, description, allegations, reported_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      caseId,
      caseNumber,
      propertyId,
      caseType,
      priority || 'MEDIUM',
      source,
      description || null,
      JSON.stringify(allegations || []),
      req.user?.id || null
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: caseId,
        caseNumber,
        status: 'OPEN',
        message: 'Case created successfully'
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

// Assign inspector to case
const assignInspector = async (req, res) => {
  try {
    const { id } = req.params;
    const { inspectorId } = req.body;

    const caseResult = await db.query('SELECT * FROM inspection_cases WHERE id = $1', [id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Case not found'
        }
      });
    }

    const caseData = caseResult.rows[0];

    const inspectorResult = await db.query("SELECT * FROM users WHERE id = $1 AND role = 'INSPECTOR'", [inspectorId]);
    if (inspectorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'INSPECTOR_NOT_FOUND',
          message: 'Inspector not found'
        }
      });
    }

    const inspector = inspectorResult.rows[0];

    await db.query(`
      UPDATE inspection_cases
      SET assigned_inspector_id = $1, status = 'ASSIGNED', assigned_at = NOW()
      WHERE id = $2
    `, [inspectorId, id]);

    // Notify inspector
    await sendSMS(
      inspector.phone,
      `NEW CASE ASSIGNED: Case ${caseData.case_number} has been assigned to you. Please review and schedule inspection.`
    );

    res.json({
      success: true,
      data: {
        message: 'Inspector assigned successfully',
        caseNumber: caseData.case_number,
        inspector: `${inspector.first_name} ${inspector.last_name}`
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

// Schedule inspection
const scheduleInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Scheduled date is required'
        }
      });
    }

    const caseResult = await db.query('SELECT * FROM inspection_cases WHERE id = $1', [id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Case not found'
        }
      });
    }

    await db.query(`
      UPDATE inspection_cases
      SET scheduled_date = $1, status = 'IN_PROGRESS'
      WHERE id = $2
    `, [scheduledDate, id]);

    res.json({
      success: true,
      data: {
        message: 'Inspection scheduled',
        scheduledDate
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

// Upload evidence
const uploadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { evidenceItems } = req.body; // Array of evidence objects

    const caseResult = await db.query('SELECT * FROM inspection_cases WHERE id = $1', [id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Case not found'
        }
      });
    }

    const caseData = caseResult.rows[0];
    const existingEvidence = typeof caseData.evidence === 'string' ? JSON.parse(caseData.evidence || '[]') : (caseData.evidence || []);
    const updatedEvidence = [...existingEvidence, ...evidenceItems.map(e => ({
      ...e,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user.id
    }))];

    await db.query('UPDATE inspection_cases SET evidence = $1 WHERE id = $2', [JSON.stringify(updatedEvidence), id]);

    res.json({
      success: true,
      data: {
        message: 'Evidence uploaded',
        totalEvidence: updatedEvidence.length
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

// Submit inspection report
const submitReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { inspectionNotes, outcome, outcomeNotes, penaltyAmount } = req.body;

    const caseResult = await db.query('SELECT * FROM inspection_cases WHERE id = $1', [id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Case not found'
        }
      });
    }

    const caseData = caseResult.rows[0];

    if (caseData.assigned_inspector_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only assigned inspector can submit report'
        }
      });
    }

    await db.query(`
      UPDATE inspection_cases
      SET inspection_date = CURRENT_DATE,
          inspection_notes = $1,
          outcome = $2,
          outcome_notes = $3,
          penalty_amount = $4,
          status = 'PENDING_REVIEW',
          completed_at = NOW()
      WHERE id = $5
    `, [inspectionNotes, outcome, outcomeNotes, penaltyAmount || null, id]);

    res.json({
      success: true,
      data: {
        message: 'Report submitted for review',
        status: 'PENDING_REVIEW'
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

// Close case
const closeCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalOutcome, notes } = req.body;

    const caseResult = await db.query('SELECT * FROM inspection_cases WHERE id = $1', [id]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Case not found'
        }
      });
    }

    const caseData = caseResult.rows[0];

    await db.query(`
      UPDATE inspection_cases
      SET status = 'CLOSED',
          outcome = COALESCE($1, outcome),
          outcome_notes = COALESCE($2, outcome_notes),
          closed_at = NOW()
      WHERE id = $3
    `, [finalOutcome, notes, id]);

    // Update landlord compliance score if violation confirmed
    if (finalOutcome === 'VIOLATION_CONFIRMED') {
      const propertyResult = await db.query('SELECT landlord_id FROM properties WHERE id = $1', [caseData.property_id]);
      if (propertyResult.rows.length > 0) {
        await db.query(`
          UPDATE users
          SET compliance_score = GREATEST(0, COALESCE(compliance_score, 100) - 10)
          WHERE id = $1
        `, [propertyResult.rows[0].landlord_id]);
      }
    }

    res.json({
      success: true,
      data: {
        message: 'Case closed',
        caseNumber: caseData.case_number,
        outcome: finalOutcome || caseData.outcome
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

// Submit anonymous tip
const submitAnonymousTip = async (req, res) => {
  try {
    const { propertyAddress, description, allegations } = req.body;

    if (!propertyAddress || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Property address and description are required'
        }
      });
    }

    // Try to find property
    const propertyResult = await db.query(`
      SELECT * FROM properties
      WHERE digital_address = $1 OR street_address ILIKE $2
    `, [propertyAddress, `%${propertyAddress}%`]);

    if (propertyResult.rows.length === 0) {
      // Create a note but no case
      return res.json({
        success: true,
        data: {
          message: 'Tip received. We will investigate the property.',
          reference: `TIP-${Date.now()}`
        }
      });
    }

    const property = propertyResult.rows[0];

    // Create case
    const caseId = generateId();
    const caseNumber = generateCaseNumber();

    await db.query(`
      INSERT INTO inspection_cases (
        id, case_number, property_id, case_type, priority, source, description, allegations, risk_score
      ) VALUES ($1, $2, $3, 'ANONYMOUS_TIP', 'MEDIUM', 'ANONYMOUS_REPORT', $4, $5, 45)
    `, [
      caseId,
      caseNumber,
      property.id,
      description,
      JSON.stringify(allegations || [])
    ]);

    res.json({
      success: true,
      data: {
        message: 'Anonymous tip submitted successfully',
        reference: caseNumber
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
  getCases,
  getCaseById,
  createCase,
  assignInspector,
  scheduleInspection,
  uploadEvidence,
  submitReport,
  closeCase,
  submitAnonymousTip
};
