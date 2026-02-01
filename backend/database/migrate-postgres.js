const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  console.log('Running PostgreSQL migrations...');

  const client = await pool.connect();

  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,

        -- Personal Info
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        other_names VARCHAR(100),
        date_of_birth DATE,
        gender VARCHAR(20),

        -- Identity
        ghana_card_number VARCHAR(20) UNIQUE,
        tin_number VARCHAR(20),
        passport_number VARCHAR(20),

        -- Address
        digital_address VARCHAR(20),
        region VARCHAR(100),
        district VARCHAR(100),
        city VARCHAR(100),
        street_address TEXT,

        -- Corporate (if applicable)
        is_corporate BOOLEAN DEFAULT FALSE,
        company_name VARCHAR(255),
        company_registration_number VARCHAR(50),

        -- Status
        status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
        verification_status VARCHAR(50) DEFAULT 'UNVERIFIED',
        compliance_score INTEGER DEFAULT 100,

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP,

        -- Preferences
        preferred_language VARCHAR(10) DEFAULT 'en',
        notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": true}'::jsonb,

        -- Push Notification Tokens
        push_token TEXT,
        device_type VARCHAR(20)
      )
    `);

    // Properties table
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Identification
        property_code VARCHAR(50) UNIQUE NOT NULL,
        digital_address VARCHAR(20) NOT NULL,

        -- Location
        region VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        city VARCHAR(100),
        neighborhood VARCHAR(100),
        street_address TEXT,
        gps_latitude DECIMAL(10, 8),
        gps_longitude DECIMAL(11, 8),

        -- Property Details
        property_type VARCHAR(50) NOT NULL,
        property_category VARCHAR(50) NOT NULL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        floor_area_sqm DECIMAL(10, 2),
        year_built INTEGER,

        -- Features
        is_furnished BOOLEAN DEFAULT FALSE,
        has_parking BOOLEAN DEFAULT FALSE,
        has_security BOOLEAN DEFAULT FALSE,
        has_generator BOOLEAN DEFAULT FALSE,
        amenities JSONB DEFAULT '[]'::jsonb,

        -- Ownership
        ownership_type VARCHAR(50) NOT NULL,
        ownership_document_url TEXT,
        ownership_verified BOOLEAN DEFAULT FALSE,

        -- Media
        photos JSONB DEFAULT '[]'::jsonb,

        -- Status
        status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
        is_available BOOLEAN DEFAULT TRUE,

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Contracts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contract_number VARCHAR(50) UNIQUE NOT NULL,

        -- Parties
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Contract Terms
        contract_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,

        -- Financial Terms
        monthly_rent DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'GHS',
        security_deposit DECIMAL(12, 2) DEFAULT 0,
        service_charge DECIMAL(12, 2) DEFAULT 0,
        advance_months INTEGER NOT NULL,
        payment_frequency VARCHAR(20) DEFAULT 'MONTHLY',

        -- Tax
        tax_rate DECIMAL(5, 4) DEFAULT 0.08,
        total_tax_withheld DECIMAL(12, 2) DEFAULT 0,

        -- Document
        contract_document_url TEXT,
        template_used VARCHAR(50),
        custom_clauses JSONB DEFAULT '[]'::jsonb,

        -- Scanned Document Data
        landlord_id_scan_url TEXT,
        tenant_id_scan_url TEXT,
        landlord_extracted_data JSONB,
        tenant_extracted_data JSONB,

        -- Digital Signatures
        landlord_signature_url TEXT,
        tenant_signature_url TEXT,

        -- Status
        status VARCHAR(50) DEFAULT 'DRAFT',
        landlord_signed BOOLEAN DEFAULT FALSE,
        landlord_signed_at TIMESTAMP,
        tenant_confirmed BOOLEAN DEFAULT FALSE,
        tenant_confirmed_at TIMESTAMP,

        -- Confirmation
        confirmation_code VARCHAR(10),
        confirmation_expires_at TIMESTAMP,

        -- Termination
        terminated_at TIMESTAMP,
        termination_reason TEXT,
        termination_initiated_by UUID REFERENCES users(id),

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_reference VARCHAR(50) UNIQUE NOT NULL,

        -- Links
        contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Amount Details
        gross_amount DECIMAL(12, 2) NOT NULL,
        tax_amount DECIMAL(12, 2) NOT NULL,
        net_amount DECIMAL(12, 2) NOT NULL,
        platform_fee DECIMAL(12, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'GHS',

        -- Period
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,

        -- Payment Method
        payment_method VARCHAR(50) NOT NULL,
        payment_provider VARCHAR(50),
        provider_reference VARCHAR(100),
        mobile_money_number VARCHAR(20),

        -- Status
        status VARCHAR(50) DEFAULT 'PENDING',

        -- Settlement
        settled_at TIMESTAMP,
        settlement_reference VARCHAR(100),

        -- Timestamps
        initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        failed_at TIMESTAMP,
        failure_reason TEXT
      )
    `);

    // Tax Certificates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        certificate_number VARCHAR(50) UNIQUE NOT NULL,

        -- Links
        landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Period
        period_type VARCHAR(20) NOT NULL,
        period_year INTEGER NOT NULL,
        period_month INTEGER,

        -- Amounts
        total_rent_received DECIMAL(12, 2) NOT NULL,
        total_tax_withheld DECIMAL(12, 2) NOT NULL,

        -- Verification
        verification_code VARCHAR(50) UNIQUE NOT NULL,
        qr_code_data TEXT,

        -- Document
        document_url TEXT,

        -- Timestamps
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        downloaded_at TIMESTAMP
      )
    `);

    // Inspection Cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inspection_cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_number VARCHAR(50) UNIQUE NOT NULL,

        -- Links
        property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        assigned_inspector_id UUID REFERENCES users(id),

        -- Case Details
        case_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        risk_score INTEGER DEFAULT 0,

        -- Source
        source VARCHAR(50) NOT NULL,
        source_reference VARCHAR(100),
        reported_by UUID REFERENCES users(id),

        -- Description
        description TEXT,
        allegations JSONB DEFAULT '[]'::jsonb,

        -- Status
        status VARCHAR(50) DEFAULT 'OPEN',

        -- Inspection
        scheduled_date TIMESTAMP,
        inspection_date TIMESTAMP,
        inspection_notes TEXT,

        -- Evidence
        evidence JSONB DEFAULT '[]'::jsonb,

        -- Outcome
        outcome VARCHAR(50),
        outcome_notes TEXT,
        penalty_amount DECIMAL(12, 2),

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_at TIMESTAMP,
        completed_at TIMESTAMP,
        closed_at TIMESTAMP
      )
    `);

    // Disputes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dispute_number VARCHAR(50) UNIQUE NOT NULL,

        -- Links
        contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
        filed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filed_against UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Dispute Details
        dispute_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        requested_resolution TEXT,

        -- Evidence
        evidence JSONB DEFAULT '[]'::jsonb,

        -- Status
        status VARCHAR(50) DEFAULT 'FILED',

        -- Resolution
        assigned_officer_id UUID REFERENCES users(id),
        resolution TEXT,
        resolution_date TIMESTAMP,

        -- Timestamps
        filed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Recipient
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Content
        notification_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}'::jsonb,

        -- Delivery
        channels JSONB DEFAULT '["in_app"]'::jsonb,
        sms_sent BOOLEAN DEFAULT FALSE,
        email_sent BOOLEAN DEFAULT FALSE,
        push_sent BOOLEAN DEFAULT FALSE,

        -- Status
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Actor
        user_id UUID REFERENCES users(id),
        user_role VARCHAR(50),
        ip_address VARCHAR(50),
        user_agent TEXT,

        -- Action
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,

        -- Changes
        old_values JSONB,
        new_values JSONB,

        -- Result
        status VARCHAR(20) DEFAULT 'SUCCESS',
        error_message TEXT,

        -- Timestamp
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Market Rent Data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_rent_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        -- Location
        region VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        neighborhood VARCHAR(100),

        -- Property Type
        property_type VARCHAR(50) NOT NULL,
        bedrooms INTEGER,

        -- Statistics
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,

        sample_size INTEGER NOT NULL,
        average_rent DECIMAL(12, 2) NOT NULL,
        median_rent DECIMAL(12, 2) NOT NULL,
        min_rent DECIMAL(12, 2) NOT NULL,
        max_rent DECIMAL(12, 2) NOT NULL,
        percentile_10 DECIMAL(12, 2),
        percentile_90 DECIMAL(12, 2),

        -- Timestamps
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // OTP table for verification
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(10) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scanned Documents table for OCR
    await client.query(`
      CREATE TABLE IF NOT EXISTS scanned_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        document_url TEXT NOT NULL,

        -- Extracted Data
        extracted_data JSONB,
        extraction_confidence DECIMAL(5, 2),

        -- Ghana Card specific
        ghana_card_number VARCHAR(20),
        full_name VARCHAR(255),
        date_of_birth DATE,
        gender VARCHAR(20),
        nationality VARCHAR(100),
        place_of_issuance VARCHAR(100),
        date_of_issuance DATE,
        expiry_date DATE,

        -- Status
        status VARCHAR(50) DEFAULT 'PENDING',
        verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP,
        verified_by UUID REFERENCES users(id),

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_properties_landlord ON properties(landlord_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contracts_landlord ON contracts(landlord_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contracts_property ON contracts(property_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_landlord ON payments(landlord_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tax_certificates_landlord ON tax_certificates(landlord_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inspection_cases_property ON inspection_cases(property_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_inspection_cases_inspector ON inspection_cases(assigned_inspector_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_disputes_contract ON disputes(contract_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_market_rent_location ON market_rent_data(region, district, neighborhood, property_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_scanned_documents_user ON scanned_documents(user_id)`);

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
