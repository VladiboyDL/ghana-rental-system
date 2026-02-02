/**
 * Contract Service - Business logic for contract management
 */

const { db } = require('../config/database');
const { generateId, generateContractNumber, generateOTP, validateContractTerms } = require('../utils/helpers');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { TAX_RATES, CONFIRMATION_EXPIRY_DAYS } = require('../config/constants');
const logger = require('../utils/logger');

class ContractService {
  /**
   * Create a new contract
   */
  static async createContract(landlordId, contractData, landlord) {
    const {
      propertyId,
      tenantId,
      tenantEmail,
      tenantPhone,
      contractType,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit = 0,
      serviceCharge = 0,
      advanceMonths,
      paymentFrequency = 'MONTHLY'
    } = contractData;

    // Validate property ownership
    const property = await this.validatePropertyOwnership(propertyId, landlordId);

    // Validate contract terms
    const validation = validateContractTerms({
      advanceMonths,
      securityDeposit,
      monthlyRent,
      startDate,
      endDate
    }, property);

    if (!validation.valid) {
      throw new ValidationError('Contract terms validation failed', validation.errors);
    }

    // Find tenant
    const tenant = await this.findTenant(tenantId, tenantEmail, tenantPhone);

    if (!tenant && !tenantPhone) {
      throw new ValidationError('Tenant ID, email, or phone number is required');
    }

    // Calculate tax rate
    const taxRate = this.calculateTaxRate(landlord);

    // Generate contract data
    const contractId = generateId();
    const contractNumber = generateContractNumber();
    const confirmationCode = generateOTP(6);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CONFIRMATION_EXPIRY_DAYS);

    // Insert contract
    await db.query(`
      INSERT INTO contracts (
        id, contract_number, property_id, landlord_id, tenant_id,
        contract_type, start_date, end_date, monthly_rent, security_deposit,
        service_charge, advance_months, payment_frequency, tax_rate,
        status, confirmation_code, confirmation_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      contractId, contractNumber, propertyId, landlordId, tenant?.id || null,
      contractType, startDate, endDate, monthlyRent, securityDeposit,
      serviceCharge, advanceMonths, paymentFrequency, taxRate,
      tenant ? 'PENDING_TENANT_CONFIRMATION' : 'DRAFT',
      confirmationCode, expiryDate.toISOString()
    ]);

    logger.info('Contract created', { contractId, landlordId, status: tenant ? 'PENDING_TENANT_CONFIRMATION' : 'DRAFT' });

    return {
      id: contractId,
      contractNumber,
      status: tenant ? 'PENDING_TENANT_CONFIRMATION' : 'DRAFT',
      confirmationCode,
      expiresAt: expiryDate.toISOString(),
      tenant,
      property
    };
  }

  /**
   * Validate property exists and belongs to landlord
   */
  static async validatePropertyOwnership(propertyId, landlordId) {
    const result = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = result.rows[0];

    if (property.landlord_id !== landlordId) {
      throw new ForbiddenError('You do not own this property');
    }

    if (property.status !== 'VERIFIED') {
      throw new ValidationError('Property must be verified before creating contracts');
    }

    return property;
  }

  /**
   * Find tenant by ID, email, or phone
   */
  static async findTenant(tenantId, tenantEmail, tenantPhone) {
    if (tenantId) {
      const result = await db.query(
        "SELECT * FROM users WHERE id = $1 AND role LIKE '%TENANT%'",
        [tenantId]
      );
      return result.rows[0];
    }

    if (tenantEmail || tenantPhone) {
      const result = await db.query(
        "SELECT * FROM users WHERE (email = $1 OR phone = $2) AND role LIKE '%TENANT%'",
        [tenantEmail, tenantPhone]
      );
      return result.rows[0];
    }

    return null;
  }

  /**
   * Calculate tax rate based on landlord type
   */
  static calculateTaxRate(landlord) {
    if (landlord.is_corporate) {
      return TAX_RATES.CORPORATE;
    }
    if (!landlord.tin_number) {
      return TAX_RATES.INDIVIDUAL_UNREGISTERED;
    }
    return TAX_RATES.INDIVIDUAL_REGISTERED;
  }

  /**
   * Get contract by ID with full details
   */
  static async getContractById(contractId, userId = null, userRole = null) {
    const result = await db.query(`
      SELECT c.*,
        p.neighborhood, p.district, p.city, p.property_type, p.digital_address,
        l.first_name as landlord_first_name, l.last_name as landlord_last_name,
        l.email as landlord_email, l.phone as landlord_phone, l.company_name as landlord_company,
        t.first_name as tenant_first_name, t.last_name as tenant_last_name,
        t.email as tenant_email, t.phone as tenant_phone
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE c.id = $1
    `, [contractId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Contract not found', 'Contract', contractId);
    }

    const contract = result.rows[0];

    // Verify access if userId provided
    if (userId && userRole) {
      const hasAccess = this.verifyContractAccess(contract, userId, userRole);
      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this contract');
      }
    }

    return this.formatContractResponse(contract);
  }

  /**
   * Verify user has access to contract
   */
  static verifyContractAccess(contract, userId, userRole) {
    if (userRole === 'ADMIN' || userRole === 'GRA_OFFICER' || userRole === 'INSPECTOR') {
      return true;
    }
    return contract.landlord_id === userId || contract.tenant_id === userId;
  }

  /**
   * Format contract for API response
   */
  static formatContractResponse(contract) {
    return {
      id: contract.id,
      contractNumber: contract.contract_number,
      status: contract.status,
      contractType: contract.contract_type,
      startDate: contract.start_date,
      endDate: contract.end_date,
      monthlyRent: parseFloat(contract.monthly_rent),
      securityDeposit: parseFloat(contract.security_deposit || 0),
      serviceCharge: parseFloat(contract.service_charge || 0),
      advanceMonths: contract.advance_months,
      paymentFrequency: contract.payment_frequency,
      taxRate: parseFloat(contract.tax_rate),
      property: {
        id: contract.property_id,
        neighborhood: contract.neighborhood,
        district: contract.district,
        city: contract.city,
        propertyType: contract.property_type,
        digitalAddress: contract.digital_address
      },
      landlord: {
        id: contract.landlord_id,
        firstName: contract.landlord_first_name,
        lastName: contract.landlord_last_name,
        email: contract.landlord_email,
        phone: contract.landlord_phone,
        companyName: contract.landlord_company
      },
      tenant: contract.tenant_id ? {
        id: contract.tenant_id,
        firstName: contract.tenant_first_name,
        lastName: contract.tenant_last_name,
        email: contract.tenant_email,
        phone: contract.tenant_phone
      } : null,
      createdAt: contract.created_at,
      updatedAt: contract.updated_at
    };
  }

  /**
   * Update contract status
   */
  static async updateStatus(contractId, newStatus, userId, userRole) {
    const contract = await this.getContractById(contractId, userId, userRole);

    // Validate status transition
    const validTransitions = {
      'DRAFT': ['PENDING_TENANT_CONFIRMATION', 'CANCELLED'],
      'PENDING_TENANT_CONFIRMATION': ['ACTIVE', 'CANCELLED', 'EXPIRED'],
      'ACTIVE': ['TERMINATED', 'EXPIRED'],
      'TERMINATED': [],
      'EXPIRED': [],
      'CANCELLED': []
    };

    if (!validTransitions[contract.status]?.includes(newStatus)) {
      throw new ValidationError(`Cannot transition from ${contract.status} to ${newStatus}`);
    }

    await db.query(
      'UPDATE contracts SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, contractId]
    );

    logger.info('Contract status updated', { contractId, oldStatus: contract.status, newStatus });

    return { ...contract, status: newStatus };
  }

  /**
   * Get contracts for user with filters
   */
  static async getContractsForUser(userId, userRole, filters = {}) {
    let query = `
      SELECT c.*,
        p.neighborhood, p.district, p.city, p.property_type,
        l.first_name as landlord_first_name, l.last_name as landlord_last_name,
        t.first_name as tenant_first_name, t.last_name as tenant_last_name
      FROM contracts c
      JOIN properties p ON c.property_id = p.id
      JOIN users l ON c.landlord_id = l.id
      LEFT JOIN users t ON c.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (userRole === 'LANDLORD') {
      query += ` AND c.landlord_id = $${paramIndex++}`;
      params.push(userId);
    } else if (userRole === 'TENANT') {
      query += ` AND c.tenant_id = $${paramIndex++}`;
      params.push(userId);
    }

    // Status filter
    if (filters.status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    query += ' ORDER BY c.created_at DESC';

    // Pagination
    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await db.query(query, params);
    return result.rows.map(row => this.formatContractResponse(row));
  }
}

module.exports = ContractService;
