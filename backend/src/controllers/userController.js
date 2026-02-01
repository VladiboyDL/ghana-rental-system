const db = require('../config/database');
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
        isCorporate: user.is_corporate === 1,
        companyName: user.company_name,
        companyRegistrationNumber: user.company_registration_number,
        status: user.status,
        verificationStatus: user.verification_status,
        complianceScore: user.compliance_score,
        preferredLanguage: user.preferred_language,
        notificationPreferences: JSON.parse(user.notification_preferences || '{}'),
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
const updateProfile = (req, res) => {
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

    if (firstName) { updates.push('first_name = ?'); params.push(firstName); }
    if (lastName) { updates.push('last_name = ?'); params.push(lastName); }
    if (otherNames !== undefined) { updates.push('other_names = ?'); params.push(otherNames); }
    if (dateOfBirth) { updates.push('date_of_birth = ?'); params.push(dateOfBirth); }
    if (gender) { updates.push('gender = ?'); params.push(gender); }
    if (tinNumber) { updates.push('tin_number = ?'); params.push(tinNumber); }
    if (digitalAddress) { updates.push('digital_address = ?'); params.push(digitalAddress); }
    if (region) { updates.push('region = ?'); params.push(region); }
    if (district) { updates.push('district = ?'); params.push(district); }
    if (city !== undefined) { updates.push('city = ?'); params.push(city); }
    if (streetAddress !== undefined) { updates.push('street_address = ?'); params.push(streetAddress); }
    if (companyName) { updates.push('company_name = ?'); params.push(companyName); }
    if (companyRegistrationNumber) { updates.push('company_registration_number = ?'); params.push(companyRegistrationNumber); }
    if (preferredLanguage) { updates.push('preferred_language = ?'); params.push(preferredLanguage); }
    if (notificationPreferences) {
      updates.push('notification_preferences = ?');
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

    updates.push('updated_at = datetime("now")');
    params.push(userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // Get updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

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
const getUserById = (req, res) => {
  try {
    const { id } = req.params;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

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
        isCorporate: user.is_corporate === 1,
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
const listUsers = (req, res) => {
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

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }
    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }
    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const users = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: users.map(user => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isCorporate: user.is_corporate === 1,
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
const updateUserStatus = (req, res) => {
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
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Update status
    db.prepare('UPDATE users SET status = ?, updated_at = datetime("now") WHERE id = ?')
      .run(status, id);

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
const getLandlords = (req, res) => {
  try {
    const { region, district, search, page = 1, limit = 20 } = req.query;

    let query = `SELECT * FROM users WHERE role IN ('LANDLORD_INDIVIDUAL', 'LANDLORD_CORPORATE')`;
    const params = [];

    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }
    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }
    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY compliance_score DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const landlords = db.prepare(query).all(...params);

    // Get property and contract counts for each landlord
    const result = landlords.map(landlord => {
      const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties WHERE landlord_id = ?')
        .get(landlord.id).count;
      const contractCount = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE landlord_id = ? AND status = ?')
        .get(landlord.id, 'ACTIVE').count;

      return {
        id: landlord.id,
        email: landlord.email,
        phone: landlord.phone,
        name: landlord.is_corporate ? landlord.company_name : `${landlord.first_name} ${landlord.last_name}`,
        isCorporate: landlord.is_corporate === 1,
        region: landlord.region,
        district: landlord.district,
        status: landlord.status,
        complianceScore: landlord.compliance_score,
        propertyCount,
        activeContracts: contractCount,
        tinNumber: landlord.tin_number,
        createdAt: landlord.created_at
      };
    });

    res.json({
      success: true,
      data: result,
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
const getTenants = (req, res) => {
  try {
    const { region, district, search, page = 1, limit = 20 } = req.query;

    let query = `SELECT * FROM users WHERE role IN ('TENANT_INDIVIDUAL', 'TENANT_CORPORATE')`;
    const params = [];

    if (region) {
      query += ' AND region = ?';
      params.push(region);
    }
    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }
    if (search) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR company_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params);

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const tenants = db.prepare(query).all(...params);

    // Get contract counts for each tenant
    const result = tenants.map(tenant => {
      const contractCount = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE tenant_id = ? AND status = ?')
        .get(tenant.id, 'ACTIVE').count;

      return {
        id: tenant.id,
        email: tenant.email,
        phone: tenant.phone,
        name: tenant.is_corporate ? tenant.company_name : `${tenant.first_name} ${tenant.last_name}`,
        isCorporate: tenant.is_corporate === 1,
        region: tenant.region,
        district: tenant.district,
        status: tenant.status,
        activeContracts: contractCount,
        createdAt: tenant.created_at
      };
    });

    res.json({
      success: true,
      data: result,
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
