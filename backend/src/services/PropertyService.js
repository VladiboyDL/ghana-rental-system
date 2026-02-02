/**
 * Property Service - Business logic for property management
 * Ghana Rental Market Platform
 */

const { db } = require('../config/database');
const { generateId, generatePropertyCode, validateDigitalAddress } = require('../utils/helpers');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../utils/errors');
const { PROPERTY_TYPES, PROPERTY_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

// Import Lands Commission simulators (for demo)
const { validateDigitalAddress: validateWithLands, verifyOwnership } = require('../simulators/lands');

class PropertyService {
  /**
   * Create a new property
   */
  static async createProperty(landlordId, propertyData) {
    const {
      digitalAddress,
      region,
      district,
      city,
      neighborhood,
      streetAddress,
      propertyType,
      propertyCategory,
      bedrooms,
      bathrooms,
      floorAreaSqm,
      yearBuilt,
      isFurnished,
      hasParking,
      hasSecurity,
      hasGenerator,
      amenities,
      ownershipType,
      gpsLatitude,
      gpsLongitude
    } = propertyData;

    // Validate required fields
    this.validatePropertyData(propertyData);

    // Check if property already exists
    const existingResult = await db.query(
      'SELECT id FROM properties WHERE digital_address = $1',
      [digitalAddress]
    );
    if (existingResult.rows.length > 0) {
      throw new ConflictError('A property with this digital address is already registered', 'digital_address', digitalAddress);
    }

    // Validate with Lands Commission (simulated for demo)
    const addressValidation = await validateWithLands(digitalAddress);
    if (!addressValidation.success) {
      throw new ValidationError(addressValidation.error || 'Address validation failed', null, 'digitalAddress');
    }

    // Generate property code and ID
    const propertyCode = generatePropertyCode(region, district, digitalAddress);
    const propertyId = generateId();

    // Insert property
    await db.query(`
      INSERT INTO properties (
        id, landlord_id, property_code, digital_address, region, district, city, neighborhood,
        street_address, gps_latitude, gps_longitude, property_type, property_category,
        bedrooms, bathrooms, floor_area_sqm, year_built, is_furnished, has_parking,
        has_security, has_generator, amenities, ownership_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    `, [
      propertyId,
      landlordId,
      propertyCode,
      digitalAddress,
      region,
      district,
      city || null,
      neighborhood || null,
      streetAddress || null,
      gpsLatitude || addressValidation.data?.latitude || null,
      gpsLongitude || addressValidation.data?.longitude || null,
      propertyType,
      propertyCategory,
      bedrooms || null,
      bathrooms || null,
      floorAreaSqm || null,
      yearBuilt || null,
      isFurnished ? true : false,
      hasParking ? true : false,
      hasSecurity ? true : false,
      hasGenerator ? true : false,
      JSON.stringify(amenities || []),
      ownershipType,
      'PENDING_VERIFICATION'
    ]);

    // Simulate auto-verification after short delay (for demo)
    this.scheduleAutoVerification(propertyId);

    logger.info('Property created', { propertyId, landlordId, digitalAddress, status: 'PENDING_VERIFICATION' });

    return {
      id: propertyId,
      propertyCode,
      digitalAddress,
      status: 'PENDING_VERIFICATION',
      message: 'Property registered successfully. Verification in progress.'
    };
  }

  /**
   * Schedule auto-verification for demo purposes
   */
  static scheduleAutoVerification(propertyId) {
    setTimeout(async () => {
      try {
        await db.query(
          "UPDATE properties SET status = $1, ownership_verified = true, updated_at = NOW() WHERE id = $2",
          ['VERIFIED', propertyId]
        );
        logger.info('Property auto-verified (demo)', { propertyId });
      } catch (err) {
        logger.error('Auto-verification error', { propertyId, error: err.message });
      }
    }, 5000);
  }

  /**
   * Validate property data
   */
  static validatePropertyData(data) {
    const errors = [];

    // Required fields
    if (!data.digitalAddress) {
      errors.push({ field: 'digitalAddress', message: 'Digital address is required' });
    }
    if (!data.region) {
      errors.push({ field: 'region', message: 'Region is required' });
    }
    if (!data.district) {
      errors.push({ field: 'district', message: 'District is required' });
    }
    if (!data.propertyType) {
      errors.push({ field: 'propertyType', message: 'Property type is required' });
    }
    if (!data.propertyCategory) {
      errors.push({ field: 'propertyCategory', message: 'Property category is required' });
    }
    if (!data.ownershipType) {
      errors.push({ field: 'ownershipType', message: 'Ownership type is required' });
    }

    // Validate property type
    if (data.propertyType && !PROPERTY_TYPES[data.propertyType]) {
      errors.push({ field: 'propertyType', message: 'Invalid property type' });
    }

    // Validate digital address format
    if (data.digitalAddress && !validateDigitalAddress(data.digitalAddress)) {
      errors.push({ field: 'digitalAddress', message: 'Invalid digital address format. Expected: XX-XXX-XXXX' });
    }

    // Validate numeric fields
    if (data.bedrooms !== undefined && data.bedrooms !== null && (isNaN(data.bedrooms) || data.bedrooms < 0)) {
      errors.push({ field: 'bedrooms', message: 'Bedrooms must be a non-negative number' });
    }
    if (data.bathrooms !== undefined && data.bathrooms !== null && (isNaN(data.bathrooms) || data.bathrooms < 0)) {
      errors.push({ field: 'bathrooms', message: 'Bathrooms must be a non-negative number' });
    }
    if (data.floorAreaSqm !== undefined && data.floorAreaSqm !== null && (isNaN(data.floorAreaSqm) || data.floorAreaSqm <= 0)) {
      errors.push({ field: 'floorAreaSqm', message: 'Floor area must be a positive number' });
    }
    if (data.yearBuilt !== undefined && data.yearBuilt !== null) {
      const currentYear = new Date().getFullYear();
      if (isNaN(data.yearBuilt) || data.yearBuilt < 1900 || data.yearBuilt > currentYear) {
        errors.push({ field: 'yearBuilt', message: `Year built must be between 1900 and ${currentYear}` });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Property validation failed', errors);
    }

    return { valid: true };
  }

  /**
   * Get property by ID with access check
   */
  static async getPropertyById(propertyId, userId = null, userRole = null) {
    const result = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.company_name, u.is_corporate,
             u.phone as landlord_phone, u.email as landlord_email
      FROM properties p
      JOIN users u ON p.landlord_id = u.id
      WHERE p.id = $1
    `, [propertyId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = result.rows[0];

    // Check authorization if user info provided
    if (userId && userRole) {
      this.verifyPropertyAccess(property, userId, userRole);
    }

    // Get active contracts count
    const contractResult = await db.query(
      "SELECT COUNT(*) as count FROM contracts WHERE property_id = $1 AND status = 'ACTIVE'",
      [propertyId]
    );
    const contractCount = parseInt(contractResult.rows[0].count);

    return this.formatPropertyResponse(property, contractCount);
  }

  /**
   * Verify user has access to property
   */
  static verifyPropertyAccess(property, userId, userRole) {
    // Admin, GRA Officer, and Inspector have full access
    if (userRole === 'SYSTEM_ADMIN' || userRole === 'GRA_OFFICER' || userRole === 'INSPECTOR' || userRole === 'DISTRICT_OFFICER') {
      return true;
    }

    // Landlord can only access their own properties
    if (userRole && userRole.includes('LANDLORD') && property.landlord_id !== userId) {
      throw new ForbiddenError('You do not have access to this property');
    }

    return true;
  }

  /**
   * Update property
   */
  static async updateProperty(propertyId, landlordId, updates, userRole = null) {
    // Check if property exists
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = checkResult.rows[0];

    // Check ownership (allow SYSTEM_ADMIN to update any property)
    if (property.landlord_id !== landlordId && userRole !== 'SYSTEM_ADMIN') {
      throw new ForbiddenError('You do not have permission to update this property');
    }

    const {
      city,
      neighborhood,
      streetAddress,
      bedrooms,
      bathrooms,
      floorAreaSqm,
      yearBuilt,
      isFurnished,
      hasParking,
      hasSecurity,
      hasGenerator,
      amenities,
      isAvailable
    } = updates;

    // Build update query
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (city !== undefined) { updateFields.push(`city = $${paramIndex++}`); params.push(city); }
    if (neighborhood !== undefined) { updateFields.push(`neighborhood = $${paramIndex++}`); params.push(neighborhood); }
    if (streetAddress !== undefined) { updateFields.push(`street_address = $${paramIndex++}`); params.push(streetAddress); }
    if (bedrooms !== undefined) { updateFields.push(`bedrooms = $${paramIndex++}`); params.push(bedrooms); }
    if (bathrooms !== undefined) { updateFields.push(`bathrooms = $${paramIndex++}`); params.push(bathrooms); }
    if (floorAreaSqm !== undefined) { updateFields.push(`floor_area_sqm = $${paramIndex++}`); params.push(floorAreaSqm); }
    if (yearBuilt !== undefined) { updateFields.push(`year_built = $${paramIndex++}`); params.push(yearBuilt); }
    if (isFurnished !== undefined) { updateFields.push(`is_furnished = $${paramIndex++}`); params.push(isFurnished ? true : false); }
    if (hasParking !== undefined) { updateFields.push(`has_parking = $${paramIndex++}`); params.push(hasParking ? true : false); }
    if (hasSecurity !== undefined) { updateFields.push(`has_security = $${paramIndex++}`); params.push(hasSecurity ? true : false); }
    if (hasGenerator !== undefined) { updateFields.push(`has_generator = $${paramIndex++}`); params.push(hasGenerator ? true : false); }
    if (amenities !== undefined) { updateFields.push(`amenities = $${paramIndex++}`); params.push(JSON.stringify(amenities)); }
    if (isAvailable !== undefined) { updateFields.push(`is_available = $${paramIndex++}`); params.push(isAvailable ? true : false); }

    if (updateFields.length === 0) {
      throw new ValidationError('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(propertyId);

    await db.query(
      `UPDATE properties SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    logger.info('Property updated', { propertyId, landlordId, fieldsUpdated: updateFields.length });

    return {
      message: 'Property updated successfully',
      propertyId
    };
  }

  /**
   * Verify property (for officers)
   */
  static async verifyProperty(propertyId, officerId, ghanaCardNumber = null) {
    // Get property
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = checkResult.rows[0];

    // For demo: Verify ownership with Lands Commission (simulated)
    const verification = await verifyOwnership(property.digital_address, ghanaCardNumber);

    if (verification.data?.verified) {
      await db.query(`
        UPDATE properties
        SET status = 'VERIFIED', ownership_verified = true, updated_at = NOW()
        WHERE id = $1
      `, [propertyId]);

      logger.info('Property verified', { propertyId, officerId, status: 'VERIFIED' });

      return {
        message: 'Property verified successfully',
        status: 'VERIFIED',
        verificationData: verification.data
      };
    }

    logger.info('Property verification pending', { propertyId, officerId });

    return {
      message: verification.data?.message || 'Verification pending manual review',
      status: 'PENDING_VERIFICATION'
    };
  }

  /**
   * Get properties for user with filters
   */
  static async getPropertiesForUser(userId, userRole, filters = {}) {
    const { status, region, district, propertyType, page = 1, limit = 20 } = filters;

    let query = `
      SELECT p.*, u.first_name, u.last_name, u.company_name, u.is_corporate
      FROM properties p
      JOIN users u ON p.landlord_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by role
    if (userRole && userRole.includes('LANDLORD')) {
      query += ` AND p.landlord_id = $${paramIndex++}`;
      params.push(userId);
    }

    // Apply filters
    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }
    if (region) {
      query += ` AND p.region = $${paramIndex++}`;
      params.push(region);
    }
    if (district) {
      query += ` AND p.district = $${paramIndex++}`;
      params.push(district);
    }
    if (propertyType) {
      query += ` AND p.property_type = $${paramIndex++}`;
      params.push(propertyType);
    }

    // Count total
    const countQuery = query.replace(
      'SELECT p.*, u.first_name, u.last_name, u.company_name, u.is_corporate',
      'SELECT COUNT(*) as total'
    );
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    return {
      properties: result.rows.map(p => this.formatPropertyListItem(p)),
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get landlord's own properties
   */
  static async getMyProperties(landlordId, filters = {}) {
    const { status, page = 1, limit = 20 } = filters;

    let whereClause = 'WHERE p.landlord_id = $1';
    const params = [landlordId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM properties p ${whereClause}`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Main query with active contracts count
    let query = `
      SELECT p.*,
             (SELECT COUNT(*) FROM contracts c WHERE c.property_id = p.id AND c.status = 'ACTIVE') as active_contracts
      FROM properties p
      ${whereClause}
    `;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    return {
      properties: result.rows.map(p => ({
        id: p.id,
        propertyCode: p.property_code,
        digitalAddress: p.digital_address,
        region: p.region,
        district: p.district,
        city: p.city,
        neighborhood: p.neighborhood,
        propertyType: p.property_type,
        propertyTypeName: PROPERTY_TYPES[p.property_type]?.name,
        propertyCategory: p.property_category,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        isFurnished: p.is_furnished === true,
        hasParking: p.has_parking === true,
        hasSecurity: p.has_security === true,
        status: p.status,
        isAvailable: p.is_available === true,
        activeContracts: parseInt(p.active_contracts || 0),
        photos: this.parseJsonField(p.photos, []),
        ownershipVerified: p.ownership_verified === true,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Search available properties (public)
   */
  static async searchAvailableProperties(filters = {}) {
    const {
      region,
      district,
      neighborhood,
      propertyType,
      propertyCategory,
      minBedrooms,
      maxBedrooms,
      minRent,
      maxRent,
      isFurnished,
      page = 1,
      limit = 20
    } = filters;

    let query = `
      SELECT p.*, u.first_name, u.last_name, u.company_name, u.is_corporate,
             (SELECT monthly_rent FROM contracts WHERE property_id = p.id ORDER BY created_at DESC LIMIT 1) as last_rent
      FROM properties p
      JOIN users u ON p.landlord_id = u.id
      WHERE p.status = 'VERIFIED' AND p.is_available = true
    `;
    const params = [];
    let paramIndex = 1;

    if (region) {
      query += ` AND p.region = $${paramIndex++}`;
      params.push(region);
    }
    if (district) {
      query += ` AND p.district = $${paramIndex++}`;
      params.push(district);
    }
    if (neighborhood) {
      query += ` AND p.neighborhood ILIKE $${paramIndex++}`;
      params.push(`%${neighborhood}%`);
    }
    if (propertyType) {
      query += ` AND p.property_type = $${paramIndex++}`;
      params.push(propertyType);
    }
    if (propertyCategory) {
      query += ` AND p.property_category = $${paramIndex++}`;
      params.push(propertyCategory);
    }
    if (minBedrooms) {
      query += ` AND p.bedrooms >= $${paramIndex++}`;
      params.push(parseInt(minBedrooms));
    }
    if (maxBedrooms) {
      query += ` AND p.bedrooms <= $${paramIndex++}`;
      params.push(parseInt(maxBedrooms));
    }
    if (isFurnished !== undefined) {
      query += ` AND p.is_furnished = $${paramIndex++}`;
      params.push(isFurnished === 'true' || isFurnished === true);
    }

    // Count total
    const countQuery = query.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    return {
      properties: result.rows.map(p => ({
        id: p.id,
        propertyCode: p.property_code,
        digitalAddress: p.digital_address,
        region: p.region,
        district: p.district,
        neighborhood: p.neighborhood,
        propertyType: p.property_type,
        propertyTypeName: PROPERTY_TYPES[p.property_type]?.name,
        propertyCategory: p.property_category,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        isFurnished: p.is_furnished === true,
        hasParking: p.has_parking === true,
        hasSecurity: p.has_security === true,
        photos: this.parseJsonField(p.photos, []),
        lastRent: p.last_rent,
        landlord: {
          name: p.is_corporate ? p.company_name : `${p.first_name} ${p.last_name}`
        }
      })),
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Upload photos to property
   */
  static async uploadPhotos(propertyId, landlordId, photos, userRole = null) {
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== landlordId && userRole !== 'SYSTEM_ADMIN') {
      throw new ForbiddenError('You do not have permission to update this property');
    }

    // Merge with existing photos
    const existingPhotos = this.parseJsonField(property.photos, []);
    const updatedPhotos = [...existingPhotos, ...(photos || [])];

    await db.query(
      'UPDATE properties SET photos = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedPhotos), propertyId]
    );

    logger.info('Property photos uploaded', { propertyId, newPhotosCount: photos?.length || 0 });

    return {
      message: 'Photos uploaded successfully',
      photos: updatedPhotos
    };
  }

  /**
   * Update property availability
   */
  static async updateAvailability(propertyId, landlordId, isAvailable, userRole = null) {
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== landlordId && userRole !== 'SYSTEM_ADMIN') {
      throw new ForbiddenError('You do not have permission to update this property');
    }

    await db.query(
      'UPDATE properties SET is_available = $1, updated_at = NOW() WHERE id = $2',
      [isAvailable ? true : false, propertyId]
    );

    logger.info('Property availability updated', { propertyId, isAvailable });

    return {
      message: 'Property availability updated',
      isAvailable: isAvailable ? true : false
    };
  }

  /**
   * List property for rent
   */
  static async listProperty(propertyId, landlordId, listingData = {}) {
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== landlordId) {
      throw new ForbiddenError('You do not have permission to list this property');
    }

    if (property.status !== 'VERIFIED') {
      throw new ValidationError('Property must be verified before listing');
    }

    await db.query(`
      UPDATE properties
      SET is_available = true, updated_at = NOW()
      WHERE id = $1
    `, [propertyId]);

    logger.info('Property listed for rent', { propertyId, landlordId });

    return {
      message: 'Property listed for rent',
      propertyId,
      ...listingData
    };
  }

  /**
   * Delete property
   */
  static async deleteProperty(propertyId, landlordId, userRole = null) {
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== landlordId && userRole !== 'SYSTEM_ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this property');
    }

    // Check for active contracts
    const contractResult = await db.query(
      "SELECT COUNT(*) as count FROM contracts WHERE property_id = $1 AND status = 'ACTIVE'",
      [propertyId]
    );
    if (parseInt(contractResult.rows[0].count) > 0) {
      throw new ValidationError('Cannot delete property with active contracts', null, 'activeContracts');
    }

    await db.query('DELETE FROM properties WHERE id = $1', [propertyId]);

    logger.info('Property deleted', { propertyId, landlordId });

    return {
      message: 'Property deleted successfully'
    };
  }

  /**
   * Request verification (landlord initiated)
   */
  static async requestVerification(propertyId, landlordId, ghanaCardNumber) {
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Property not found', 'Property', propertyId);
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== landlordId) {
      throw new ForbiddenError('You do not have permission to verify this property');
    }

    // Verify ownership with Lands Commission (simulated for demo)
    const verification = await verifyOwnership(property.digital_address, ghanaCardNumber);

    if (verification.data?.verified) {
      await db.query(`
        UPDATE properties
        SET status = 'VERIFIED', ownership_verified = true, updated_at = NOW()
        WHERE id = $1
      `, [propertyId]);

      logger.info('Property verification successful', { propertyId, landlordId });

      return {
        message: 'Property verified successfully',
        status: 'VERIFIED'
      };
    }

    logger.info('Property verification pending', { propertyId, landlordId });

    return {
      message: verification.data?.message || 'Verification pending manual review',
      status: 'PENDING_VERIFICATION'
    };
  }

  /**
   * Format property response for API
   */
  static formatPropertyResponse(property, activeContracts = 0) {
    return {
      id: property.id,
      propertyCode: property.property_code,
      digitalAddress: property.digital_address,
      region: property.region,
      district: property.district,
      city: property.city,
      neighborhood: property.neighborhood,
      streetAddress: property.street_address,
      gpsLatitude: property.gps_latitude,
      gpsLongitude: property.gps_longitude,
      propertyType: property.property_type,
      propertyTypeName: PROPERTY_TYPES[property.property_type]?.name,
      propertyCategory: property.property_category,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      floorAreaSqm: property.floor_area_sqm,
      yearBuilt: property.year_built,
      isFurnished: property.is_furnished === true,
      hasParking: property.has_parking === true,
      hasSecurity: property.has_security === true,
      hasGenerator: property.has_generator === true,
      amenities: this.parseJsonField(property.amenities, []),
      ownershipType: property.ownership_type,
      ownershipDocumentUrl: property.ownership_document_url,
      ownershipVerified: property.ownership_verified === true,
      photos: this.parseJsonField(property.photos, []),
      status: property.status,
      isAvailable: property.is_available === true,
      activeContracts,
      landlord: {
        id: property.landlord_id,
        name: property.is_corporate ? property.company_name : `${property.first_name} ${property.last_name}`,
        phone: property.landlord_phone,
        email: property.landlord_email
      },
      createdAt: property.created_at,
      updatedAt: property.updated_at
    };
  }

  /**
   * Format property list item
   */
  static formatPropertyListItem(p) {
    return {
      id: p.id,
      propertyCode: p.property_code,
      digitalAddress: p.digital_address,
      region: p.region,
      district: p.district,
      city: p.city,
      neighborhood: p.neighborhood,
      propertyType: p.property_type,
      propertyTypeName: PROPERTY_TYPES[p.property_type]?.name,
      propertyCategory: p.property_category,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      isFurnished: p.is_furnished === true,
      hasParking: p.has_parking === true,
      hasSecurity: p.has_security === true,
      status: p.status,
      isAvailable: p.is_available === true,
      photos: this.parseJsonField(p.photos, []),
      ownershipVerified: p.ownership_verified === true,
      landlord: {
        id: p.landlord_id,
        name: p.is_corporate ? p.company_name : `${p.first_name} ${p.last_name}`
      },
      createdAt: p.created_at
    };
  }

  /**
   * Safely parse JSON field
   */
  static parseJsonField(field, defaultValue = []) {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field || JSON.stringify(defaultValue));
      } catch {
        return defaultValue;
      }
    }
    return field || defaultValue;
  }
}

module.exports = PropertyService;
