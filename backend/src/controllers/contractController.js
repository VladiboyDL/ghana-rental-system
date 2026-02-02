const { db } = require('../config/database');
const {
  generateId,
  generateContractNumber,
  generateOTP,
  validateContractTerms
} = require('../utils/helpers');
const { sendContractNotification, sendSMS } = require('../simulators/sms');
const { PROPERTY_TYPES, CONTRACT_STATUS, TAX_RATES, CONFIRMATION_EXPIRY_DAYS } = require('../config/constants');

// Create contract
const createContract = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const {
      propertyId,
      tenantEmail,
      tenantPhone,
      tenantId, // If existing tenant
      contractType,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      serviceCharge,
      advanceMonths,
      paymentFrequency
    } = req.body;

    // Validate required fields
    if (!propertyId || !startDate || !endDate || !monthlyRent || !advanceMonths || !contractType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: propertyId, startDate, endDate, monthlyRent, advanceMonths, contractType'
        }
      });
    }

    // Check property exists and belongs to landlord
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

    const property = propertyResult.rows[0];

    if (property.landlord_id !== landlordId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not own this property'
        }
      });
    }

    if (property.status !== 'VERIFIED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROPERTY_NOT_VERIFIED',
          message: 'Property must be verified before creating contracts'
        }
      });
    }

    // Validate contract terms
    const validation = validateContractTerms({
      advanceMonths,
      securityDeposit: securityDeposit || 0,
      monthlyRent,
      startDate,
      endDate
    }, property);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Contract terms validation failed',
          details: validation.errors
        }
      });
    }

    // Find or identify tenant
    let tenant;
    if (tenantId) {
      const tenantResult = await db.query("SELECT * FROM users WHERE id = $1 AND role LIKE '%TENANT%'", [tenantId]);
      tenant = tenantResult.rows[0];
    } else if (tenantEmail || tenantPhone) {
      const tenantResult = await db.query("SELECT * FROM users WHERE (email = $1 OR phone = $2) AND role LIKE '%TENANT%'", [tenantEmail, tenantPhone]);
      tenant = tenantResult.rows[0];
    }

    if (!tenant && !tenantPhone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant ID, email, or phone number is required'
        }
      });
    }

    // Get landlord info for notification
    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [landlordId]);
    const landlord = landlordResult.rows[0];

    // Generate confirmation code
    const confirmationCode = generateOTP(6);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CONFIRMATION_EXPIRY_DAYS);

    // Determine tax rate
    let taxRate = TAX_RATES.INDIVIDUAL_REGISTERED;
    if (landlord.is_corporate) {
      taxRate = TAX_RATES.CORPORATE;
    } else if (!landlord.tin_number) {
      taxRate = TAX_RATES.INDIVIDUAL_UNREGISTERED;
    }

    // Create contract
    const contractId = generateId();
    const contractNumber = generateContractNumber();

    await db.query(`
      INSERT INTO contracts (
        id, contract_number, property_id, landlord_id, tenant_id,
        contract_type, start_date, end_date, monthly_rent, security_deposit,
        service_charge, advance_months, payment_frequency, tax_rate,
        status, confirmation_code, confirmation_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      contractId,
      contractNumber,
      propertyId,
      landlordId,
      tenant?.id || null,
      contractType,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit || 0,
      serviceCharge || 0,
      advanceMonths,
      paymentFrequency || 'MONTHLY',
      taxRate,
      tenant ? 'PENDING_TENANT_CONFIRMATION' : 'DRAFT',
      confirmationCode,
      expiryDate.toISOString()
    ]);

    // Send notification to tenant
    const notificationPhone = tenant?.phone || tenantPhone;
    if (notificationPhone) {
      const landlordName = landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`;
      const propertyAddress = `${property.neighborhood || ''}, ${property.district}`.trim().replace(/^,\s*/, '');

      await sendContractNotification(
        notificationPhone,
        landlordName,
        propertyAddress,
        monthlyRent,
        confirmationCode
      );
    }

    res.status(201).json({
      success: true,
      data: {
        id: contractId,
        contractNumber,
        status: tenant ? 'PENDING_TENANT_CONFIRMATION' : 'DRAFT',
        confirmationCode,
        expiresAt: expiryDate.toISOString(),
        message: tenant ?
          'Contract created. Confirmation code sent to tenant.' :
          'Contract created as draft. Tenant information required.'
      }
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get contracts (filtered by role)
const getContracts = async (req, res) => {
  try {
    const user = req.user;
    const { status, propertyId, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT c.*,
             p.property_code, p.digital_address, p.neighborhood, p.district, p.property_type,
             l.first_name as landlord_first_name, l.last_name as landlord_last_name,
             l.company_name as landlord_company, l.is_corporate as landlord_is_corporate,
             t.first_name as tenant_first_name, t.last_name as tenant_last_name,
             t.company_name as tenant_company, t.is_corporate as tenant_is_corporate
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by role
    if (user.role.includes('LANDLORD')) {
      query += ` AND c.landlord_id = $${paramIndex++}`;
      params.push(user.id);
    } else if (user.role.includes('TENANT')) {
      query += ` AND c.tenant_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }
    if (propertyId) {
      query += ` AND c.property_id = $${paramIndex++}`;
      params.push(propertyId);
    }

    // Count total
    const countQuery = query.replace(/SELECT c\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(c => ({
        id: c.id,
        contractNumber: c.contract_number,
        contractType: c.contract_type,
        status: c.status,
        startDate: c.start_date,
        endDate: c.end_date,
        monthlyRent: c.monthly_rent,
        securityDeposit: c.security_deposit,
        advanceMonths: c.advance_months,
        taxRate: c.tax_rate,
        totalTaxWithheld: c.total_tax_withheld,
        property: {
          id: c.property_id,
          propertyCode: c.property_code,
          digitalAddress: c.digital_address,
          neighborhood: c.neighborhood,
          district: c.district,
          propertyType: c.property_type,
          propertyTypeName: PROPERTY_TYPES[c.property_type]?.name
        },
        landlord: {
          id: c.landlord_id,
          name: c.landlord_is_corporate ? c.landlord_company : `${c.landlord_first_name} ${c.landlord_last_name}`
        },
        tenant: c.tenant_id ? {
          id: c.tenant_id,
          name: c.tenant_is_corporate ? c.tenant_company : `${c.tenant_first_name} ${c.tenant_last_name}`
        } : null,
        tenantConfirmed: c.tenant_confirmed === true,
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

// Get contract by ID
const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await db.query(`
      SELECT c.*,
             p.*, p.id as prop_id,
             l.first_name as landlord_first_name, l.last_name as landlord_last_name,
             l.company_name as landlord_company, l.is_corporate as landlord_is_corporate,
             l.phone as landlord_phone, l.email as landlord_email,
             t.first_name as tenant_first_name, t.last_name as tenant_last_name,
             t.company_name as tenant_company, t.is_corporate as tenant_is_corporate,
             t.phone as tenant_phone, t.email as tenant_email
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE c.id = $1
    `, [id]);

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

    // Check authorization
    const isLandlord = contract.landlord_id === user.id;
    const isTenant = contract.tenant_id === user.id;
    const isAdmin = user.role === 'SYSTEM_ADMIN' || user.role === 'GRA_OFFICER';

    if (!isLandlord && !isTenant && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this contract'
        }
      });
    }

    // Get payment history
    const paymentsResult = await db.query(`
      SELECT * FROM payments WHERE contract_id = $1 ORDER BY initiated_at DESC LIMIT 10
    `, [id]);

    res.json({
      success: true,
      data: {
        id: contract.id,
        contractNumber: contract.contract_number,
        contractType: contract.contract_type,
        status: contract.status,
        startDate: contract.start_date,
        endDate: contract.end_date,
        monthlyRent: contract.monthly_rent,
        securityDeposit: contract.security_deposit,
        serviceCharge: contract.service_charge,
        advanceMonths: contract.advance_months,
        paymentFrequency: contract.payment_frequency,
        taxRate: contract.tax_rate,
        totalTaxWithheld: contract.total_tax_withheld,
        contractDocumentUrl: contract.contract_document_url,
        customClauses: typeof contract.custom_clauses === 'string' ? JSON.parse(contract.custom_clauses || '[]') : (contract.custom_clauses || []),
        landlordSigned: contract.landlord_signed === true,
        landlordSignedAt: contract.landlord_signed_at,
        tenantConfirmed: contract.tenant_confirmed === true,
        tenantConfirmedAt: contract.tenant_confirmed_at,
        property: {
          id: contract.property_id,
          propertyCode: contract.property_code,
          digitalAddress: contract.digital_address,
          region: contract.region,
          district: contract.district,
          neighborhood: contract.neighborhood,
          propertyType: contract.property_type,
          propertyTypeName: PROPERTY_TYPES[contract.property_type]?.name,
          bedrooms: contract.bedrooms,
          bathrooms: contract.bathrooms,
          isFurnished: contract.is_furnished === true
        },
        landlord: {
          id: contract.landlord_id,
          name: contract.landlord_is_corporate ? contract.landlord_company : `${contract.landlord_first_name} ${contract.landlord_last_name}`,
          phone: contract.landlord_phone,
          email: contract.landlord_email
        },
        tenant: contract.tenant_id ? {
          id: contract.tenant_id,
          name: contract.tenant_is_corporate ? contract.tenant_company : `${contract.tenant_first_name} ${contract.tenant_last_name}`,
          phone: contract.tenant_phone,
          email: contract.tenant_email
        } : null,
        payments: paymentsResult.rows.map(p => ({
          id: p.id,
          reference: p.payment_reference,
          grossAmount: p.gross_amount,
          taxAmount: p.tax_amount,
          netAmount: p.net_amount,
          status: p.status,
          periodStart: p.period_start,
          periodEnd: p.period_end,
          completedAt: p.completed_at
        })),
        createdAt: contract.created_at,
        updatedAt: contract.updated_at
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

// Confirm contract (tenant)
const confirmContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationCode } = req.body;
    const tenantId = req.user.id;

    const contractResult = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
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

    if (contract.status !== 'PENDING_TENANT_CONFIRMATION') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Contract is not pending confirmation'
        }
      });
    }

    // Verify confirmation code
    if (contract.confirmation_code !== confirmationCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid confirmation code'
        }
      });
    }

    // Check expiry
    if (new Date(contract.confirmation_expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CODE_EXPIRED',
          message: 'Confirmation code has expired'
        }
      });
    }

    // Update contract
    await db.query(`
      UPDATE contracts
      SET status = 'ACTIVE',
          tenant_id = $1,
          tenant_confirmed = true,
          tenant_confirmed_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
    `, [tenantId, id]);

    // Mark property as not available
    await db.query('UPDATE properties SET is_available = false, updated_at = NOW() WHERE id = $1', [contract.property_id]);

    // Notify landlord
    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [contract.landlord_id]);
    const landlord = landlordResult.rows[0];
    if (landlord) {
      await sendSMS(
        landlord.phone,
        `CONTRACT CONFIRMED: Your rental contract ${contract.contract_number} has been confirmed by the tenant. Contract is now active.`
      );
    }

    res.json({
      success: true,
      data: {
        message: 'Contract confirmed successfully',
        contractNumber: contract.contract_number,
        status: 'ACTIVE'
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

// Object to contract (tenant)
const objectToContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const contractResult = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
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

    if (contract.status !== 'PENDING_TENANT_CONFIRMATION') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Contract is not pending confirmation'
        }
      });
    }

    // Update contract status
    await db.query(`
      UPDATE contracts
      SET status = 'DISPUTED',
          updated_at = NOW()
      WHERE id = $1
    `, [id]);

    // Create dispute
    const disputeId = generateId();
    const disputeNumber = `DSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;

    await db.query(`
      INSERT INTO disputes (id, dispute_number, contract_id, filed_by, filed_against, dispute_type, description)
      VALUES ($1, $2, $3, $4, $5, 'CONTRACT_TERMS', $6)
    `, [disputeId, disputeNumber, id, req.user.id, contract.landlord_id, `${reason}: ${description}`]);

    // Notify landlord
    const landlordResult = await db.query('SELECT * FROM users WHERE id = $1', [contract.landlord_id]);
    const landlord = landlordResult.rows[0];
    if (landlord) {
      await sendSMS(
        landlord.phone,
        `CONTRACT OBJECTION: The tenant has objected to contract ${contract.contract_number}. Reason: ${reason}. Please review the dispute.`
      );
    }

    res.json({
      success: true,
      data: {
        message: 'Objection filed successfully',
        disputeNumber,
        contractStatus: 'DISPUTED'
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

// Terminate contract
const terminateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const contractResult = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
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

    // Check authorization
    if (contract.landlord_id !== userId && contract.tenant_id !== userId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to terminate this contract'
        }
      });
    }

    if (contract.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only active contracts can be terminated'
        }
      });
    }

    // Update contract
    await db.query(`
      UPDATE contracts
      SET status = 'TERMINATED',
          terminated_at = NOW(),
          termination_reason = $1,
          termination_initiated_by = $2,
          updated_at = NOW()
      WHERE id = $3
    `, [reason, userId, id]);

    // Mark property as available
    await db.query('UPDATE properties SET is_available = true, updated_at = NOW() WHERE id = $1', [contract.property_id]);

    // Notify other party
    const otherPartyId = userId === contract.landlord_id ? contract.tenant_id : contract.landlord_id;
    const otherPartyResult = await db.query('SELECT * FROM users WHERE id = $1', [otherPartyId]);
    const otherParty = otherPartyResult.rows[0];
    if (otherParty) {
      await sendSMS(
        otherParty.phone,
        `CONTRACT TERMINATED: Contract ${contract.contract_number} has been terminated. Reason: ${reason}`
      );
    }

    res.json({
      success: true,
      data: {
        message: 'Contract terminated successfully',
        contractNumber: contract.contract_number,
        status: 'TERMINATED'
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

// Renew contract
const renewContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, newMonthlyRent, newAdvanceMonths } = req.body;

    const contractResult = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
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

    if (contract.landlord_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only landlord can renew the contract'
        }
      });
    }

    if (contract.status !== 'ACTIVE' && contract.status !== 'EXPIRED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Only active or expired contracts can be renewed'
        }
      });
    }

    // Create new contract based on old one
    const newContractId = generateId();
    const newContractNumber = generateContractNumber();
    const confirmationCode = generateOTP(6);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CONFIRMATION_EXPIRY_DAYS);

    const startDate = new Date(contract.end_date);
    startDate.setDate(startDate.getDate() + 1);

    await db.query(`
      INSERT INTO contracts (
        id, contract_number, property_id, landlord_id, tenant_id,
        contract_type, start_date, end_date, monthly_rent, security_deposit,
        service_charge, advance_months, payment_frequency, tax_rate,
        status, confirmation_code, confirmation_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDING_TENANT_CONFIRMATION', $15, $16)
    `, [
      newContractId,
      newContractNumber,
      contract.property_id,
      contract.landlord_id,
      contract.tenant_id,
      contract.contract_type,
      startDate.toISOString().split('T')[0],
      newEndDate,
      newMonthlyRent || contract.monthly_rent,
      contract.security_deposit,
      contract.service_charge,
      newAdvanceMonths || contract.advance_months,
      contract.payment_frequency,
      contract.tax_rate,
      confirmationCode,
      expiryDate.toISOString()
    ]);

    // Notify tenant
    const tenantResult = await db.query('SELECT * FROM users WHERE id = $1', [contract.tenant_id]);
    const tenant = tenantResult.rows[0];
    if (tenant) {
      await sendSMS(
        tenant.phone,
        `CONTRACT RENEWAL: Your landlord has proposed renewing your rental contract. New rent: GHS ${newMonthlyRent || contract.monthly_rent}/month. Confirmation code: ${confirmationCode}`
      );
    }

    res.json({
      success: true,
      data: {
        message: 'Renewal contract created',
        newContractId,
        newContractNumber,
        status: 'PENDING_TENANT_CONFIRMATION'
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

// Get pending confirmations for tenant
const getPendingConfirmations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userPhone = req.user.phone;

    // Find contracts pending confirmation for this tenant (by ID or phone)
    const result = await db.query(`
      SELECT c.*, p.property_code, p.digital_address, p.neighborhood, p.district, p.property_type,
             l.first_name, l.last_name, l.company_name, l.is_corporate
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users l ON c.landlord_id = l.id
      WHERE c.status = 'PENDING_TENANT_CONFIRMATION'
      AND (c.tenant_id = $1 OR c.tenant_id IS NULL)
      AND c.confirmation_expires_at > NOW()
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: result.rows.map(c => ({
        id: c.id,
        contractNumber: c.contract_number,
        monthlyRent: c.monthly_rent,
        advanceMonths: c.advance_months,
        securityDeposit: c.security_deposit,
        startDate: c.start_date,
        endDate: c.end_date,
        expiresAt: c.confirmation_expires_at,
        property: {
          propertyCode: c.property_code,
          digitalAddress: c.digital_address,
          neighborhood: c.neighborhood,
          district: c.district,
          propertyType: PROPERTY_TYPES[c.property_type]?.name
        },
        landlord: {
          name: c.is_corporate ? c.company_name : `${c.first_name} ${c.last_name}`
        }
      }))
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

// Get my contracts (filtered by user role - landlord or tenant)
const getMyContracts = async (req, res) => {
  try {
    const user = req.user;
    const { status, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT c.*,
             p.property_code, p.digital_address, p.neighborhood, p.district, p.property_type,
             l.first_name as landlord_first_name, l.last_name as landlord_last_name,
             l.company_name as landlord_company, l.is_corporate as landlord_is_corporate,
             t.first_name as tenant_first_name, t.last_name as tenant_last_name,
             t.company_name as tenant_company, t.is_corporate as tenant_is_corporate
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by role
    if (user.role.includes('LANDLORD')) {
      query += ` AND c.landlord_id = $${paramIndex++}`;
      params.push(user.id);
    } else if (user.role.includes('TENANT')) {
      query += ` AND c.tenant_id = $${paramIndex++}`;
      params.push(user.id);
    } else {
      // For admin/GRA, return empty if they use /my endpoint
      return res.json({ success: true, data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }

    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }

    // Count total
    const countQuery = query.replace(/SELECT c\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(c => ({
        id: c.id,
        contractNumber: c.contract_number,
        contractType: c.contract_type,
        status: c.status,
        startDate: c.start_date,
        endDate: c.end_date,
        monthlyRent: c.monthly_rent,
        securityDeposit: c.security_deposit,
        advanceMonths: c.advance_months,
        taxRate: c.tax_rate,
        totalTaxWithheld: c.total_tax_withheld,
        property: {
          id: c.property_id,
          propertyCode: c.property_code,
          digitalAddress: c.digital_address,
          neighborhood: c.neighborhood,
          district: c.district,
          propertyType: c.property_type,
          propertyTypeName: PROPERTY_TYPES[c.property_type]?.name
        },
        landlord: {
          id: c.landlord_id,
          name: c.landlord_is_corporate ? c.landlord_company : `${c.landlord_first_name} ${c.landlord_last_name}`
        },
        tenant: c.tenant_id ? {
          id: c.tenant_id,
          name: c.tenant_is_corporate ? c.tenant_company : `${c.tenant_first_name} ${c.tenant_last_name}`
        } : null,
        tenantConfirmed: c.tenant_confirmed === true,
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
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Get contract payments
const getContractPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Verify contract access
    const contractResult = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contract not found' }
      });
    }

    const contract = contractResult.rows[0];
    const isLandlord = contract.landlord_id === user.id;
    const isTenant = contract.tenant_id === user.id;
    const isAdmin = user.role === 'SYSTEM_ADMIN' || user.role === 'GRA_OFFICER';

    if (!isLandlord && !isTenant && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const paymentsResult = await db.query(`
      SELECT * FROM payments WHERE contract_id = $1 ORDER BY initiated_at DESC
    `, [id]);

    res.json({
      success: true,
      data: paymentsResult.rows.map(p => ({
        id: p.id,
        reference: p.payment_reference,
        grossAmount: p.gross_amount,
        taxAmount: p.tax_amount,
        netAmount: p.net_amount,
        status: p.status,
        paymentMethod: p.payment_method,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        initiatedAt: p.initiated_at,
        completedAt: p.completed_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Update contract (landlord only, before confirmation)
const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceCharge, notes } = req.body;

    const contractResult = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contract not found' }
      });
    }

    const contract = contractResult.rows[0];

    if (contract.landlord_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only landlord can update the contract' }
      });
    }

    if (contract.status !== 'DRAFT' && contract.status !== 'PENDING_TENANT_CONFIRMATION') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Cannot update contract after confirmation' }
      });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (serviceCharge !== undefined) {
      updates.push(`service_charge = $${paramIndex++}`);
      params.push(serviceCharge);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_UPDATES', message: 'No fields to update' }
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await db.query(`UPDATE contracts SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);

    res.json({
      success: true,
      data: { message: 'Contract updated successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

// Cancel contract (landlord only, before confirmation)
const cancelContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const contractResult = await db.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Contract not found' }
      });
    }

    const contract = contractResult.rows[0];

    if (contract.landlord_id !== req.user.id && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only landlord can cancel the contract' }
      });
    }

    if (contract.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Use terminate for active contracts' }
      });
    }

    await db.query(`
      UPDATE contracts
      SET status = 'CANCELLED',
          termination_reason = $1,
          terminated_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
    `, [reason || 'Cancelled by landlord', id]);

    res.json({
      success: true,
      data: { message: 'Contract cancelled successfully' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: error.message }
    });
  }
};

module.exports = {
  createContract,
  getContracts,
  getContractById,
  getMyContracts,
  getContractPayments,
  updateContract,
  cancelContract,
  confirmContract,
  objectToContract,
  terminateContract,
  renewContract,
  getPendingConfirmations
};
