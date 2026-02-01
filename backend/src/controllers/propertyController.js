const { db } = require('../config/database');
const { generateId, generatePropertyCode, validateDigitalAddress } = require('../utils/helpers');
const { validateDigitalAddress: validateWithLands, verifyOwnership } = require('../simulators/lands');
const { PROPERTY_TYPES, PROPERTY_STATUS } = require('../config/constants');

// Create property
const createProperty = async (req, res) => {
  try {
    const landlordId = req.user.id;
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
    } = req.body;

    // Validate required fields
    if (!digitalAddress || !region || !district || !propertyType || !propertyCategory || !ownershipType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields: digitalAddress, region, district, propertyType, propertyCategory, ownershipType'
        }
      });
    }

    // Validate property type
    if (!PROPERTY_TYPES[propertyType]) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROPERTY_TYPE',
          message: 'Invalid property type'
        }
      });
    }

    // Validate digital address format
    if (!validateDigitalAddress(digitalAddress)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ADDRESS',
          message: 'Invalid digital address format. Expected: XX-XXX-XXXX'
        }
      });
    }

    // Check if property already exists
    const existingResult = await db.query('SELECT id FROM properties WHERE digital_address = $1', [digitalAddress]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROPERTY_EXISTS',
          message: 'A property with this digital address is already registered'
        }
      });
    }

    // Validate with Lands Commission (simulated)
    const addressValidation = await validateWithLands(digitalAddress);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ADDRESS_VALIDATION_FAILED',
          message: addressValidation.error
        }
      });
    }

    // Generate property code
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
    setTimeout(async () => {
      try {
        await db.query("UPDATE properties SET status = $1, ownership_verified = true, updated_at = NOW() WHERE id = $2", ['VERIFIED', propertyId]);
      } catch (err) {
        console.error('Auto-verification error:', err);
      }
    }, 5000);

    res.status(201).json({
      success: true,
      data: {
        id: propertyId,
        propertyCode,
        digitalAddress,
        status: 'PENDING_VERIFICATION',
        message: 'Property registered successfully. Verification in progress.'
      }
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Get properties (filtered by role)
const getProperties = async (req, res) => {
  try {
    const user = req.user;
    const { status, region, district, propertyType, page = 1, limit = 20 } = req.query;

    let query = 'SELECT p.*, u.first_name, u.last_name, u.company_name, u.is_corporate FROM properties p JOIN users u ON p.landlord_id = u.id WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filter by role
    if (user.role.includes('LANDLORD')) {
      query += ` AND p.landlord_id = $${paramIndex++}`;
      params.push(user.id);
    }

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
    const countQuery = query.replace('SELECT p.*, u.first_name, u.last_name, u.company_name, u.is_corporate', 'SELECT COUNT(*) as total');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(p => ({
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
        photos: typeof p.photos === 'string' ? JSON.parse(p.photos || '[]') : (p.photos || []),
        ownershipVerified: p.ownership_verified === true,
        landlord: {
          id: p.landlord_id,
          name: p.is_corporate ? p.company_name : `${p.first_name} ${p.last_name}`
        },
        createdAt: p.created_at
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

// Get property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.company_name, u.is_corporate, u.phone as landlord_phone, u.email as landlord_email
      FROM properties p
      JOIN users u ON p.landlord_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property not found'
        }
      });
    }

    const property = result.rows[0];

    // Check authorization for non-admin users
    if (user.role.includes('LANDLORD') && property.landlord_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this property'
        }
      });
    }

    // Get active contracts count
    const contractResult = await db.query(`
      SELECT COUNT(*) as count FROM contracts WHERE property_id = $1 AND status = 'ACTIVE'
    `, [id]);
    const contractCount = parseInt(contractResult.rows[0].count);

    res.json({
      success: true,
      data: {
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
        amenities: typeof property.amenities === 'string' ? JSON.parse(property.amenities || '[]') : (property.amenities || []),
        ownershipType: property.ownership_type,
        ownershipDocumentUrl: property.ownership_document_url,
        ownershipVerified: property.ownership_verified === true,
        photos: typeof property.photos === 'string' ? JSON.parse(property.photos || '[]') : (property.photos || []),
        status: property.status,
        isAvailable: property.is_available === true,
        activeContracts: contractCount,
        landlord: {
          id: property.landlord_id,
          name: property.is_corporate ? property.company_name : `${property.first_name} ${property.last_name}`,
          phone: property.landlord_phone,
          email: property.landlord_email
        },
        createdAt: property.created_at,
        updatedAt: property.updated_at
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

// Update property
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    // Check if property exists and belongs to user
    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property not found'
        }
      });
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== landlordId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this property'
        }
      });
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
    } = req.body;

    // Build update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (city !== undefined) { updates.push(`city = $${paramIndex++}`); params.push(city); }
    if (neighborhood !== undefined) { updates.push(`neighborhood = $${paramIndex++}`); params.push(neighborhood); }
    if (streetAddress !== undefined) { updates.push(`street_address = $${paramIndex++}`); params.push(streetAddress); }
    if (bedrooms !== undefined) { updates.push(`bedrooms = $${paramIndex++}`); params.push(bedrooms); }
    if (bathrooms !== undefined) { updates.push(`bathrooms = $${paramIndex++}`); params.push(bathrooms); }
    if (floorAreaSqm !== undefined) { updates.push(`floor_area_sqm = $${paramIndex++}`); params.push(floorAreaSqm); }
    if (yearBuilt !== undefined) { updates.push(`year_built = $${paramIndex++}`); params.push(yearBuilt); }
    if (isFurnished !== undefined) { updates.push(`is_furnished = $${paramIndex++}`); params.push(isFurnished ? true : false); }
    if (hasParking !== undefined) { updates.push(`has_parking = $${paramIndex++}`); params.push(hasParking ? true : false); }
    if (hasSecurity !== undefined) { updates.push(`has_security = $${paramIndex++}`); params.push(hasSecurity ? true : false); }
    if (hasGenerator !== undefined) { updates.push(`has_generator = $${paramIndex++}`); params.push(hasGenerator ? true : false); }
    if (amenities !== undefined) { updates.push(`amenities = $${paramIndex++}`); params.push(JSON.stringify(amenities)); }
    if (isAvailable !== undefined) { updates.push(`is_available = $${paramIndex++}`); params.push(isAvailable ? true : false); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No fields to update'
        }
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    await db.query(`UPDATE properties SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);

    res.json({
      success: true,
      data: {
        message: 'Property updated successfully',
        propertyId: id
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

// Search available properties (public)
const searchProperties = async (req, res) => {
  try {
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
    } = req.query;

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
      params.push(isFurnished === 'true');
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

    res.json({
      success: true,
      data: result.rows.map(p => ({
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
        photos: typeof p.photos === 'string' ? JSON.parse(p.photos || '[]') : (p.photos || []),
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

// Upload property photos
const uploadPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body; // Array of photo URLs

    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property not found'
        }
      });
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== req.user.id && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this property'
        }
      });
    }

    // Merge with existing photos
    const existingPhotos = typeof property.photos === 'string' ? JSON.parse(property.photos || '[]') : (property.photos || []);
    const updatedPhotos = [...existingPhotos, ...(photos || [])];

    await db.query('UPDATE properties SET photos = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(updatedPhotos), id]);

    res.json({
      success: true,
      data: {
        message: 'Photos uploaded successfully',
        photos: updatedPhotos
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

// Request verification
const requestVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const checkResult = await db.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property not found'
        }
      });
    }

    const property = checkResult.rows[0];

    if (property.landlord_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to verify this property'
        }
      });
    }

    // Verify ownership with Lands Commission (simulated)
    const verification = await verifyOwnership(property.digital_address, req.user.ghana_card_number);

    if (verification.data?.verified) {
      await db.query(`
        UPDATE properties
        SET status = 'VERIFIED', ownership_verified = true, updated_at = NOW()
        WHERE id = $1
      `, [id]);

      return res.json({
        success: true,
        data: {
          message: 'Property verified successfully',
          status: 'VERIFIED'
        }
      });
    }

    res.json({
      success: true,
      data: {
        message: verification.data?.message || 'Verification pending manual review',
        status: 'PENDING_VERIFICATION'
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
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  searchProperties,
  uploadPhotos,
  requestVerification
};
