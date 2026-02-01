const db = require('../config/database');
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
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROPERTY_NOT_FOUND',
          message: 'Property not found'
        }
      });
    }

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
      tenant = db.prepare('SELECT * FROM users WHERE id = ? AND role LIKE ?').get(tenantId, '%TENANT%');
    } else if (tenantEmail || tenantPhone) {
      tenant = db.prepare('SELECT * FROM users WHERE (email = ? OR phone = ?) AND role LIKE ?')
        .get(tenantEmail, tenantPhone, '%TENANT%');
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
    const landlord = db.prepare('SELECT * FROM users WHERE id = ?').get(landlordId);

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

    const stmt = db.prepare(`
      INSERT INTO contracts (
        id, contract_number, property_id, landlord_id, tenant_id,
        contract_type, start_date, end_date, monthly_rent, security_deposit,
        service_charge, advance_months, payment_frequency, tax_rate,
        status, confirmation_code, confirmation_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
    );

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
const getContracts = (req, res) => {
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

    // Filter by role
    if (user.role.includes('LANDLORD')) {
      query += ' AND c.landlord_id = ?';
      params.push(user.id);
    } else if (user.role.includes('TENANT')) {
      query += ' AND c.tenant_id = ?';
      params.push(user.id);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (propertyId) {
      query += ' AND c.property_id = ?';
      params.push(propertyId);
    }

    // Count total
    const countQuery = query.replace(/SELECT c\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const { total } = db.prepare(countQuery).get(...params);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const contracts = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: contracts.map(c => ({
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
        tenantConfirmed: c.tenant_confirmed === 1,
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
const getContractById = (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const contract = db.prepare(`
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
      WHERE c.id = ?
    `).get(id);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

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
    const payments = db.prepare(`
      SELECT * FROM payments WHERE contract_id = ? ORDER BY initiated_at DESC LIMIT 10
    `).all(id);

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
        customClauses: JSON.parse(contract.custom_clauses || '[]'),
        landlordSigned: contract.landlord_signed === 1,
        landlordSignedAt: contract.landlord_signed_at,
        tenantConfirmed: contract.tenant_confirmed === 1,
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
          isFurnished: contract.is_furnished === 1
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
        payments: payments.map(p => ({
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

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

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
    db.prepare(`
      UPDATE contracts
      SET status = 'ACTIVE',
          tenant_id = ?,
          tenant_confirmed = 1,
          tenant_confirmed_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(tenantId, id);

    // Mark property as not available
    db.prepare('UPDATE properties SET is_available = 0, updated_at = datetime("now") WHERE id = ?')
      .run(contract.property_id);

    // Notify landlord
    const landlord = db.prepare('SELECT * FROM users WHERE id = ?').get(contract.landlord_id);
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

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

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
    db.prepare(`
      UPDATE contracts
      SET status = 'DISPUTED',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(id);

    // Create dispute
    const disputeId = generateId();
    const disputeNumber = `DSP-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;

    db.prepare(`
      INSERT INTO disputes (id, dispute_number, contract_id, filed_by, filed_against, dispute_type, description)
      VALUES (?, ?, ?, ?, ?, 'CONTRACT_TERMS', ?)
    `).run(disputeId, disputeNumber, id, req.user.id, contract.landlord_id, `${reason}: ${description}`);

    // Notify landlord
    const landlord = db.prepare('SELECT * FROM users WHERE id = ?').get(contract.landlord_id);
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

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

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
    db.prepare(`
      UPDATE contracts
      SET status = 'TERMINATED',
          terminated_at = datetime('now'),
          termination_reason = ?,
          termination_initiated_by = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(reason, userId, id);

    // Mark property as available
    db.prepare('UPDATE properties SET is_available = 1, updated_at = datetime("now") WHERE id = ?')
      .run(contract.property_id);

    // Notify other party
    const otherPartyId = userId === contract.landlord_id ? contract.tenant_id : contract.landlord_id;
    const otherParty = db.prepare('SELECT * FROM users WHERE id = ?').get(otherPartyId);
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

    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Contract not found'
        }
      });
    }

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

    db.prepare(`
      INSERT INTO contracts (
        id, contract_number, property_id, landlord_id, tenant_id,
        contract_type, start_date, end_date, monthly_rent, security_deposit,
        service_charge, advance_months, payment_frequency, tax_rate,
        status, confirmation_code, confirmation_expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_TENANT_CONFIRMATION', ?, ?)
    `).run(
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
    );

    // Notify tenant
    const tenant = db.prepare('SELECT * FROM users WHERE id = ?').get(contract.tenant_id);
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
const getPendingConfirmations = (req, res) => {
  try {
    const userId = req.user.id;
    const userPhone = req.user.phone;

    // Find contracts pending confirmation for this tenant (by ID or phone)
    const contracts = db.prepare(`
      SELECT c.*, p.property_code, p.digital_address, p.neighborhood, p.district, p.property_type,
             l.first_name, l.last_name, l.company_name, l.is_corporate
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users l ON c.landlord_id = l.id
      WHERE c.status = 'PENDING_TENANT_CONFIRMATION'
      AND (c.tenant_id = ? OR c.tenant_id IS NULL)
      AND c.confirmation_expires_at > datetime('now')
      ORDER BY c.created_at DESC
    `).all(userId);

    res.json({
      success: true,
      data: contracts.map(c => ({
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

module.exports = {
  createContract,
  getContracts,
  getContractById,
  confirmContract,
  objectToContract,
  terminateContract,
  renewContract,
  getPendingConfirmations
};
