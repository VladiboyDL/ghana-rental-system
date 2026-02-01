const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { generateId, generateOTP, validateGhanaPhone, formatGhanaPhone, validateGhanaCard } = require('../utils/helpers');
const { verifyGhanaCard } = require('../simulators/nia');
const { sendOTP } = require('../simulators/sms');
const { ROLES, USER_STATUS, VERIFICATION_STATUS } = require('../config/constants');

// Register new user
const register = async (req, res) => {
  try {
    const { email, phone, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !phone || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required'
        }
      });
    }

    // Validate phone number
    const formattedPhone = formatGhanaPhone(phone);
    if (!validateGhanaPhone(formattedPhone)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Invalid Ghana phone number format'
        }
      });
    }

    // Validate role
    const validRoles = [ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE, ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Invalid user role'
        }
      });
    }

    // Check if user exists
    const existingResult = await db.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, formattedPhone]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email or phone already exists'
        }
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store pending registration with OTP
    const userId = generateId();
    const otpId = generateId();

    await db.query(
      `INSERT INTO otp_codes (id, phone, code, purpose, expires_at)
       VALUES ($1, $2, $3, 'registration', $4)`,
      [otpId, formattedPhone, otp, otpExpiry]
    );

    // Store user data temporarily (pending OTP verification)
    await db.query(
      `INSERT INTO users (id, email, phone, password_hash, first_name, last_name, role, status, is_corporate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING_VERIFICATION', $8)`,
      [userId, email, formattedPhone, passwordHash, firstName, lastName, role, role.includes('CORPORATE')]
    );

    // Send OTP via SMS
    await sendOTP(formattedPhone, otp, 'verification');

    res.status(201).json({
      success: true,
      data: {
        userId,
        message: 'OTP sent to your phone. Please verify to complete registration.',
        expiresIn: 600 // seconds
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: error.message
      }
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Phone and code are required'
        }
      });
    }

    const formattedPhone = formatGhanaPhone(phone);

    // Find OTP
    const otpResult = await db.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND code = $2 AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [formattedPhone, code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid or expired OTP'
        }
      });
    }

    const otpRecord = otpResult.rows[0];

    // Mark OTP as used
    await db.query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRecord.id]);

    // Update user status based on purpose
    if (otpRecord.purpose === 'registration') {
      await db.query(`UPDATE users SET status = 'ACTIVE' WHERE phone = $1`, [formattedPhone]);
    }

    // Get user
    const userResult = await db.query('SELECT * FROM users WHERE phone = $1', [formattedPhone]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const user = userResult.rows[0];

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        message: 'OTP verified successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: error.message
      }
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Find user by email or phone
    const userResult = await db.query(
      `SELECT * FROM users WHERE email = $1 OR phone = $2`,
      [email, formatGhanaPhone(email)]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const user = userResult.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check user status
    if (user.status === 'SUSPENDED' || user.status === 'BLACKLISTED') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled'
        }
      });
    }

    if (user.status === 'PENDING_VERIFICATION') {
      // Send new OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await db.query(
        `INSERT INTO otp_codes (id, phone, code, purpose, expires_at)
         VALUES ($1, $2, $3, 'verification', $4)`,
        [generateId(), user.phone, otp, otpExpiry]
      );

      await sendOTP(user.phone, otp, 'verification');

      return res.status(403).json({
        success: false,
        error: {
          code: 'VERIFICATION_REQUIRED',
          message: 'Please verify your phone number. OTP sent.',
          userId: user.id
        }
      });
    }

    // Update last login
    await db.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          complianceScore: user.compliance_score,
          isCorporate: user.is_corporate,
          companyName: user.company_name
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: error.message
      }
    });
  }
};

// Logout
const logout = (req, res) => {
  // JWT is stateless, client should remove token
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
    }

    // Find user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        data: {
          message: 'If an account exists with this email, a reset code will be sent to your phone.'
        }
      });
    }

    const user = userResult.rows[0];

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    await db.query(
      `INSERT INTO otp_codes (id, phone, code, purpose, expires_at)
       VALUES ($1, $2, $3, 'password_reset', $4)`,
      [generateId(), user.phone, otp, otpExpiry]
    );

    await sendOTP(user.phone, otp, 'password_reset');

    res.json({
      success: true,
      data: {
        message: 'Password reset code sent to your phone.',
        phone: user.phone.substr(0, 5) + '****' + user.phone.substr(-2)
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Phone, code, and new password are required'
        }
      });
    }

    const formattedPhone = formatGhanaPhone(phone);

    // Find OTP
    const otpResult = await db.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND code = $2 AND purpose = 'password_reset' AND used = false AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [formattedPhone, code]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid or expired reset code'
        }
      });
    }

    const otpRecord = otpResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE phone = $2',
      [passwordHash, formattedPhone]
    );

    // Mark OTP as used
    await db.query('UPDATE otp_codes SET used = true WHERE id = $1', [otpRecord.id]);

    res.json({
      success: true,
      data: {
        message: 'Password reset successfully. You can now login with your new password.'
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR',
        message: error.message
      }
    });
  }
};

// Verify Ghana Card identity
const verifyIdentity = async (req, res) => {
  try {
    const { ghanaCardNumber } = req.body;
    const userId = req.user.id;

    if (!ghanaCardNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ghana Card number is required'
        }
      });
    }

    if (!validateGhanaCard(ghanaCardNumber)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid Ghana Card number format. Expected: GHA-XXXXXXXXX-X'
        }
      });
    }

    // Check if card already used
    const existingResult = await db.query(
      'SELECT id FROM users WHERE ghana_card_number = $1 AND id != $2',
      [ghanaCardNumber, userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CARD_IN_USE',
          message: 'This Ghana Card is already registered to another account'
        }
      });
    }

    // Verify with NIA (simulated)
    const verification = await verifyGhanaCard(ghanaCardNumber);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: verification.error
        }
      });
    }

    // Update user with verified identity
    await db.query(
      `UPDATE users
       SET ghana_card_number = $1,
           verification_status = 'VERIFIED',
           digital_address = COALESCE(digital_address, $2),
           updated_at = NOW()
       WHERE id = $3`,
      [ghanaCardNumber, verification.data.address, userId]
    );

    res.json({
      success: true,
      data: {
        message: 'Identity verified successfully',
        verifiedData: {
          firstName: verification.data.firstName,
          lastName: verification.data.lastName,
          dateOfBirth: verification.data.dateOfBirth,
          gender: verification.data.gender,
          address: verification.data.address
        }
      }
    });
  } catch (error) {
    console.error('Identity verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: error.message
      }
    });
  }
};

// Refresh token
const refreshToken = (req, res) => {
  try {
    const token = generateToken(req.user.id);

    res.json({
      success: true,
      data: {
        token
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

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { phone, purpose } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Phone number is required'
        }
      });
    }

    const formattedPhone = formatGhanaPhone(phone);

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await db.query(
      `INSERT INTO otp_codes (id, phone, code, purpose, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [generateId(), formattedPhone, otp, purpose || 'verification', otpExpiry]
    );

    await sendOTP(formattedPhone, otp, purpose || 'verification');

    res.json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        expiresIn: 600
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
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
  register,
  verifyOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyIdentity,
  refreshToken,
  resendOTP
};
