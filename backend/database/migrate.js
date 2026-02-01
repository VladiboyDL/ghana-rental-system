const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbDir = path.resolve(__dirname);
const dbPath = path.resolve(__dirname, 'ghana_rental.db');

async function migrate() {
  console.log('Running migrations...');

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,

      -- Personal Info
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      other_names TEXT,
      date_of_birth TEXT,
      gender TEXT,

      -- Identity
      ghana_card_number TEXT UNIQUE,
      tin_number TEXT,
      passport_number TEXT,

      -- Address
      digital_address TEXT,
      region TEXT,
      district TEXT,
      city TEXT,
      street_address TEXT,

      -- Corporate (if applicable)
      is_corporate INTEGER DEFAULT 0,
      company_name TEXT,
      company_registration_number TEXT,

      -- Status
      status TEXT DEFAULT 'PENDING_VERIFICATION',
      verification_status TEXT DEFAULT 'UNVERIFIED',
      compliance_score INTEGER DEFAULT 100,

      -- Timestamps
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT,

      -- Preferences
      preferred_language TEXT DEFAULT 'en',
      notification_preferences TEXT DEFAULT '{"sms": true, "email": true, "push": true}'
    )
  `);

  // Properties table
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      landlord_id TEXT NOT NULL REFERENCES users(id),

      -- Identification
      property_code TEXT UNIQUE NOT NULL,
      digital_address TEXT NOT NULL,

      -- Location
      region TEXT NOT NULL,
      district TEXT NOT NULL,
      city TEXT,
      neighborhood TEXT,
      street_address TEXT,
      gps_latitude REAL,
      gps_longitude REAL,

      -- Property Details
      property_type TEXT NOT NULL,
      property_category TEXT NOT NULL,
      bedrooms INTEGER,
      bathrooms INTEGER,
      floor_area_sqm REAL,
      year_built INTEGER,

      -- Features
      is_furnished INTEGER DEFAULT 0,
      has_parking INTEGER DEFAULT 0,
      has_security INTEGER DEFAULT 0,
      has_generator INTEGER DEFAULT 0,
      amenities TEXT DEFAULT '[]',

      -- Ownership
      ownership_type TEXT NOT NULL,
      ownership_document_url TEXT,
      ownership_verified INTEGER DEFAULT 0,

      -- Media
      photos TEXT DEFAULT '[]',

      -- Status
      status TEXT DEFAULT 'PENDING_VERIFICATION',
      is_available INTEGER DEFAULT 1,

      -- Timestamps
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Contracts table
  db.run(`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      contract_number TEXT UNIQUE NOT NULL,

      -- Parties
      property_id TEXT NOT NULL REFERENCES properties(id),
      landlord_id TEXT NOT NULL REFERENCES users(id),
      tenant_id TEXT NOT NULL REFERENCES users(id),

      -- Contract Terms
      contract_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,

      -- Financial Terms
      monthly_rent REAL NOT NULL,
      currency TEXT DEFAULT 'GHS',
      security_deposit REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      advance_months INTEGER NOT NULL,
      payment_frequency TEXT DEFAULT 'MONTHLY',

      -- Tax
      tax_rate REAL DEFAULT 0.08,
      total_tax_withheld REAL DEFAULT 0,

      -- Document
      contract_document_url TEXT,
      template_used TEXT,
      custom_clauses TEXT DEFAULT '[]',

      -- Status
      status TEXT DEFAULT 'DRAFT',
      landlord_signed INTEGER DEFAULT 0,
      landlord_signed_at TEXT,
      tenant_confirmed INTEGER DEFAULT 0,
      tenant_confirmed_at TEXT,

      -- Confirmation
      confirmation_code TEXT,
      confirmation_expires_at TEXT,

      -- Termination
      terminated_at TEXT,
      termination_reason TEXT,
      termination_initiated_by TEXT REFERENCES users(id),

      -- Timestamps
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Payments table
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_reference TEXT UNIQUE NOT NULL,

      -- Links
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      tenant_id TEXT NOT NULL REFERENCES users(id),
      landlord_id TEXT NOT NULL REFERENCES users(id),

      -- Amount Details
      gross_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      net_amount REAL NOT NULL,
      platform_fee REAL DEFAULT 0,
      currency TEXT DEFAULT 'GHS',

      -- Period
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,

      -- Payment Method
      payment_method TEXT NOT NULL,
      payment_provider TEXT,
      provider_reference TEXT,

      -- Status
      status TEXT DEFAULT 'PENDING',

      -- Settlement
      settled_at TEXT,
      settlement_reference TEXT,

      -- Timestamps
      initiated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      failed_at TEXT,
      failure_reason TEXT
    )
  `);

  // Tax Certificates table
  db.run(`
    CREATE TABLE IF NOT EXISTS tax_certificates (
      id TEXT PRIMARY KEY,
      certificate_number TEXT UNIQUE NOT NULL,

      -- Links
      landlord_id TEXT NOT NULL REFERENCES users(id),

      -- Period
      period_type TEXT NOT NULL,
      period_year INTEGER NOT NULL,
      period_month INTEGER,

      -- Amounts
      total_rent_received REAL NOT NULL,
      total_tax_withheld REAL NOT NULL,

      -- Verification
      verification_code TEXT UNIQUE NOT NULL,
      qr_code_data TEXT,

      -- Document
      document_url TEXT,

      -- Timestamps
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      downloaded_at TEXT
    )
  `);

  // Inspection Cases table
  db.run(`
    CREATE TABLE IF NOT EXISTS inspection_cases (
      id TEXT PRIMARY KEY,
      case_number TEXT UNIQUE NOT NULL,

      -- Links
      property_id TEXT NOT NULL REFERENCES properties(id),
      assigned_inspector_id TEXT REFERENCES users(id),

      -- Case Details
      case_type TEXT NOT NULL,
      priority TEXT DEFAULT 'MEDIUM',
      risk_score INTEGER DEFAULT 0,

      -- Source
      source TEXT NOT NULL,
      source_reference TEXT,
      reported_by TEXT REFERENCES users(id),

      -- Description
      description TEXT,
      allegations TEXT DEFAULT '[]',

      -- Status
      status TEXT DEFAULT 'OPEN',

      -- Inspection
      scheduled_date TEXT,
      inspection_date TEXT,
      inspection_notes TEXT,

      -- Evidence
      evidence TEXT DEFAULT '[]',

      -- Outcome
      outcome TEXT,
      outcome_notes TEXT,
      penalty_amount REAL,

      -- Timestamps
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      assigned_at TEXT,
      completed_at TEXT,
      closed_at TEXT
    )
  `);

  // Disputes table
  db.run(`
    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      dispute_number TEXT UNIQUE NOT NULL,

      -- Links
      contract_id TEXT NOT NULL REFERENCES contracts(id),
      filed_by TEXT NOT NULL REFERENCES users(id),
      filed_against TEXT NOT NULL REFERENCES users(id),

      -- Dispute Details
      dispute_type TEXT NOT NULL,
      description TEXT NOT NULL,
      requested_resolution TEXT,

      -- Evidence
      evidence TEXT DEFAULT '[]',

      -- Status
      status TEXT DEFAULT 'FILED',

      -- Resolution
      assigned_officer_id TEXT REFERENCES users(id),
      resolution TEXT,
      resolution_date TEXT,

      -- Timestamps
      filed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,

      -- Recipient
      user_id TEXT NOT NULL REFERENCES users(id),

      -- Content
      notification_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT DEFAULT '{}',

      -- Delivery
      channels TEXT DEFAULT '["in_app"]',
      sms_sent INTEGER DEFAULT 0,
      email_sent INTEGER DEFAULT 0,
      push_sent INTEGER DEFAULT 0,

      -- Status
      is_read INTEGER DEFAULT 0,
      read_at TEXT,

      -- Timestamps
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Audit Logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,

      -- Actor
      user_id TEXT REFERENCES users(id),
      user_role TEXT,
      ip_address TEXT,
      user_agent TEXT,

      -- Action
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,

      -- Changes
      old_values TEXT,
      new_values TEXT,

      -- Result
      status TEXT DEFAULT 'SUCCESS',
      error_message TEXT,

      -- Timestamp
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Market Rent Data table
  db.run(`
    CREATE TABLE IF NOT EXISTS market_rent_data (
      id TEXT PRIMARY KEY,

      -- Location
      region TEXT NOT NULL,
      district TEXT NOT NULL,
      neighborhood TEXT,

      -- Property Type
      property_type TEXT NOT NULL,
      bedrooms INTEGER,

      -- Statistics
      period_year INTEGER NOT NULL,
      period_month INTEGER NOT NULL,

      sample_size INTEGER NOT NULL,
      average_rent REAL NOT NULL,
      median_rent REAL NOT NULL,
      min_rent REAL NOT NULL,
      max_rent REAL NOT NULL,
      percentile_10 REAL,
      percentile_90 REAL,

      -- Timestamps
      calculated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // OTP table for verification
  db.run(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_landlord ON contracts(landlord_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_property ON contracts(property_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_landlord ON payments(landlord_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tax_certificates_landlord ON tax_certificates(landlord_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inspection_cases_property ON inspection_cases(property_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_inspection_cases_inspector ON inspection_cases(assigned_inspector_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_disputes_contract ON disputes(contract_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_market_rent_location ON market_rent_data(region, district, neighborhood, property_type)`);

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('Migrations completed successfully!');

  db.close();
}

migrate().catch(console.error);
