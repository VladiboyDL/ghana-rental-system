const { db } = require('../config/database');
const { ROLES } = require('../config/constants');

// Get current user profile
const getProfile = (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        otherNames: user.other_names,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        role: user.role,
        ghanaCardNumber: user.ghana_card_number,
        tinNumber: user.tin_number,
        digitalAddress: user.digital_address,
        region: user.region,
        district: user.district,
        city: user.city,
        streetAddress: user.street_address,
        isCorporate: user.is_corporate === true || user.is_corporate === 1,
        companyName: user.company_name,
        companyRegistrationNumber: user.company_registration_number,
        status: user.status,
        verificationStatus: user.verification_status,
        complianceScore: user.compliance_score,
        preferredLanguage: user.preferred_language,
        notificationPreferences: typeof user.notification_preferences === 'string'
          ? JSON.parse(user.notification_preferences || '{}')
          : (user.notification_preferences || {}),
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
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

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      otherNames,
      dateOfBirth,
      gender,
      tinNumber,
      digitalAddress,
      region,
      district,
      city,
      streetAddress,
      companyName,
      companyRegistrationNumber,
      preferredLanguage,
      notificationPreferences
    } = req.body;

    // Build update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (firstName) { updates.push(`first_name = $${paramIndex++}`); params.push(firstName); }
    if (lastName) { updates.push(`last_name = $${paramIndex++}`); params.push(lastName); }
    if (otherNames !== undefined) { updates.push(`other_names = $${paramIndex++}`); params.push(otherNames); }
    if (dateOfBirth) { updates.push(`date_of_birth = $${paramIndex++}`); params.push(dateOfBirth); }
    if (gender) { updates.push(`gender = $${paramIndex++}`); params.push(gender); }
    if (tinNumber) { updates.push(`tin_number = $${paramIndex++}`); params.push(tinNumber); }
    if (digitalAddress) { updates.push(`digital_address = $${paramIndex++}`); params.push(digitalAddress); }
    if (region) { updates.push(`region = $${paramIndex++}`); params.push(region); }
    if (district) { updates.push(`district = $${paramIndex++}`); params.push(district); }
    if (city !== undefined) { updates.push(`city = $${paramIndex++}`); params.push(city); }
    if (streetAddress !== undefined) { updates.push(`street_address = $${paramIndex++}`); params.push(streetAddress); }
    if (companyName) { updates.push(`company_name = $${paramIndex++}`); params.push(companyName); }
    if (companyRegistrationNumber) { updates.push(`company_registration_number = $${paramIndex++}`); params.push(companyRegistrationNumber); }
    if (preferredLanguage) { updates.push(`preferred_language = $${paramIndex++}`); params.push(preferredLanguage); }
    if (notificationPreferences) {
      updates.push(`notification_preferences = $${paramIndex++}`);
      params.push(JSON.stringify(notificationPreferences));
    }

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
    params.push(userId);

    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);

    // Get updated user
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          phone: updatedUser.phone,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          role: updatedUser.role,
          status: updatedUser.status
        }
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

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        ghanaCardNumber: user.ghana_card_number,
        tinNumber: user.tin_number,
        digitalAddress: user.digital_address,
        region: user.region,
        district: user.district,
        isCorporate: user.is_corporate === true || user.is_corporate === 1,
        companyName: user.company_name,
        status: user.status,
        verificationStatus: user.verification_status,
        complianceScore: user.compliance_score,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at
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

// List users with filters (admin only)
const listUsers = async (req, res) => {
  try {
    const {
      role,
      status,
      region,
      district,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex++}`;
      params.push(role);
    }
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (region) {
      query += ` AND region = $${paramIndex++}`;
      params.push(region);
    }
    if (district) {
      query += ` AND district = $${paramIndex++}`;
      params.push(district);
    }
    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isCorporate: user.is_corporate === true || user.is_corporate === 1,
        companyName: user.company_name,
        region: user.region,
        district: user.district,
        status: user.status,
        verificationStatus: user.verification_status,
        complianceScore: user.compliance_score,
        createdAt: user.created_at
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

// Update user status (admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status value'
        }
      });
    }

    // Check if user exists
    const checkResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update status
    await db.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);

    res.json({
      success: true,
      data: {
        message: 'User status updated successfully',
        userId: id,
        newStatus: status
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

// Get landlords (for GRA/admin)
const getLandlords = async (req, res) => {
  try {
    const { region, district, search, page = 1, limit = 20 } = req.query;

    let query = `SELECT * FROM users WHERE role IN ('LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE')`;
    const params = [];
    let paramIndex = 1;

    if (region) {
      query += ` AND region = $${paramIndex++}`;
      params.push(region);
    }
    if (district) {
      query += ` AND district = $${paramIndex++}`;
      params.push(district);
    }
    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY compliance_score DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    // Get property and contract counts for each landlord
    const landlords = await Promise.all(result.rows.map(async (landlord) => {
      const propertyCountResult = await db.query('SELECT COUNT(*) as count FROM properties WHERE landlord_id = $1', [landlord.id]);
      const contractCountResult = await db.query("SELECT COUNT(*) as count FROM contracts WHERE landlord_id = $1 AND status = 'ACTIVE'", [landlord.id]);

      return {
        id: landlord.id,
        email: landlord.email,
        phone: landlord.phone,
        name: landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`,
        isCorporate: landlord.is_corporate === true || landlord.is_corporate === 1,
        region: landlord.region,
        district: landlord.district,
        status: landlord.status,
        complianceScore: landlord.compliance_score,
        propertyCount: parseInt(propertyCountResult.rows[0].count),
        activeContracts: parseInt(contractCountResult.rows[0].count),
        tinNumber: landlord.tin_number,
        createdAt: landlord.created_at
      };
    }));

    res.json({
      success: true,
      data: landlords,
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

// Get tenants (for GRA/admin)
const getTenants = async (req, res) => {
  try {
    const { region, district, search, page = 1, limit = 20 } = req.query;

    let query = `SELECT * FROM users WHERE role IN ('TENANT_INDIVIDUAL', 'TENANT_CORPORATE')`;
    const params = [];
    let paramIndex = 1;

    if (region) {
      query += ` AND region = $${paramIndex++}`;
      params.push(region);
    }
    if (district) {
      query += ` AND district = $${paramIndex++}`;
      params.push(district);
    }
    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    // Get contract counts for each tenant
    const tenants = await Promise.all(result.rows.map(async (tenant) => {
      const contractCountResult = await db.query("SELECT COUNT(*) as count FROM contracts WHERE tenant_id = $1 AND status = 'ACTIVE'", [tenant.id]);

      return {
        id: tenant.id,
        email: tenant.email,
        phone: tenant.phone,
        name: tenant.is_corporate ? tenant.company_name : `${tenant.first_name} ${tenant.last_name}`,
        isCorporate: tenant.is_corporate === true || tenant.is_corporate === 1,
        region: tenant.region,
        district: tenant.district,
        status: tenant.status,
        activeContracts: parseInt(contractCountResult.rows[0].count),
        createdAt: tenant.created_at
      };
    }));

    res.json({
      success: true,
      data: tenants,
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

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  listUsers,
  updateUserStatus,
  getLandlords,
  getTenants
};
