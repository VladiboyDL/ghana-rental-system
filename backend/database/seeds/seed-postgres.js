const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  console.log('Seeding PostgreSQL database...');

  const client = await pool.connect();

  try {
    const passwordHash = await bcrypt.hash('demo123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    // Demo Users - using .com emails to match frontend
    const usersResult = await client.query(`
      INSERT INTO users (email, phone, password_hash, role, first_name, last_name, ghana_card_number, tin_number, digital_address, region, district, city, status, verification_status)
      VALUES
        ('landlord@demo.com', '+233241000001', $1, 'LANDLORD_INDIVIDUAL', 'Kwame', 'Asante', 'GHA-123456789-0', 'P0012345678', 'GA-123-4567', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'ACTIVE', 'VERIFIED'),
        ('tenant@demo.com', '+233241000002', $1, 'TENANT_INDIVIDUAL', 'Ama', 'Mensah', 'GHA-987654321-0', NULL, 'GA-234-5678', 'Greater Accra', 'Tema Metropolitan', 'Tema', 'ACTIVE', 'VERIFIED'),
        ('landlord2@demo.com', '+233241000003', $1, 'LANDLORD_INDIVIDUAL', 'Yaw', 'Boateng', 'GHA-456789123-0', 'P0023456789', 'AS-456-7890', 'Ashanti', 'Kumasi Metropolitan', 'Kumasi', 'ACTIVE', 'VERIFIED'),
        ('tenant2@demo.com', '+233241000004', $1, 'TENANT_INDIVIDUAL', 'Kofi', 'Owusu', 'GHA-789123456-0', NULL, 'AS-567-8901', 'Ashanti', 'Kumasi Metropolitan', 'Kumasi', 'ACTIVE', 'VERIFIED'),
        ('gra@demo.com', '+233241000005', $1, 'GRA_OFFICER', 'Grace', 'Addo', 'GHA-111222333-0', NULL, 'GA-678-9012', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'ACTIVE', 'VERIFIED'),
        ('inspector@demo.com', '+233241000006', $1, 'INSPECTOR', 'Isaac', 'Nkrumah', 'GHA-444555666-0', NULL, 'GA-789-0123', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'ACTIVE', 'VERIFIED'),
        ('supervisor@demo.com', '+233241000007', $1, 'GRA_SUPERVISOR', 'Sarah', 'Danso', 'GHA-777888999-0', NULL, 'GA-890-1234', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'ACTIVE', 'VERIFIED'),
        ('admin@demo.com', '+233241000008', $2, 'SYSTEM_ADMIN', 'Admin', 'User', 'GHA-000000001-0', NULL, 'GA-000-0001', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'ACTIVE', 'VERIFIED')
      RETURNING id, email, role
    `, [passwordHash, adminPasswordHash]);

    console.log('Users seeded:', usersResult.rows.length);

    const users = usersResult.rows;
    const landlord1 = users.find(u => u.email === 'landlord@demo.com');
    const landlord2 = users.find(u => u.email === 'landlord2@demo.com');
    const tenant1 = users.find(u => u.email === 'tenant@demo.com');
    const tenant2 = users.find(u => u.email === 'tenant2@demo.com');
    const inspector = users.find(u => u.email === 'inspector@demo.com');

    // Demo Properties - Using correct property type codes from constants.js
    // R-3B = 3-Bedroom, R-4B+ = 4+ Bedroom, R-2B = 2-Bedroom, C-OFF = Office, R-VL = Villa
    const propertiesResult = await client.query(`
      INSERT INTO properties (landlord_id, property_code, digital_address, region, district, city, neighborhood, property_type, property_category, bedrooms, bathrooms, floor_area_sqm, year_built, is_furnished, has_parking, has_security, has_generator, ownership_type, ownership_verified, status, is_available)
      VALUES
        ($1, 'PROP-ACC-001', 'GA-123-4567', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'East Legon', 'R-3B', 'RESIDENTIAL', 3, 2, 120, 2020, true, true, true, false, 'FREEHOLD', true, 'VERIFIED', false),
        ($1, 'PROP-ACC-002', 'GA-234-5678', 'Greater Accra', 'Tema Metropolitan', 'Tema', 'Community 25', 'R-4B+', 'RESIDENTIAL', 4, 3, 200, 2018, false, true, true, true, 'FREEHOLD', true, 'VERIFIED', true),
        ($2, 'PROP-KUM-001', 'AS-345-6789', 'Ashanti', 'Kumasi Metropolitan', 'Kumasi', 'Ahodwo', 'R-2B', 'RESIDENTIAL', 2, 2, 85, 2021, true, true, false, false, 'LEASEHOLD', true, 'VERIFIED', false),
        ($2, 'PROP-KUM-002', 'AS-456-7890', 'Ashanti', 'Kumasi Metropolitan', 'Kumasi', 'Nhyiaeso', 'C-OFF', 'COMMERCIAL', 0, 2, 150, 2019, false, true, true, true, 'FREEHOLD', false, 'PENDING_VERIFICATION', true),
        ($1, 'PROP-ACC-003', 'GA-567-8901', 'Greater Accra', 'Accra Metropolitan', 'Accra', 'Cantonments', 'R-VL', 'RESIDENTIAL', 5, 4, 300, 2022, true, true, true, true, 'FREEHOLD', true, 'VERIFIED', true)
      RETURNING id, property_code
    `, [landlord1.id, landlord2.id]);

    console.log('Properties seeded:', propertiesResult.rows.length);
    const properties = propertiesResult.rows;

    // Demo Contracts
    const contractsResult = await client.query(`
      INSERT INTO contracts (contract_number, property_id, landlord_id, tenant_id, contract_type, start_date, end_date, monthly_rent, security_deposit, service_charge, advance_months, payment_frequency, tax_rate, total_tax_withheld, status, landlord_signed, landlord_signed_at, tenant_confirmed, tenant_confirmed_at, confirmation_code, confirmation_expires_at)
      VALUES
        ('CTR-2024-0001', $1, $2, $3, 'RESIDENTIAL', '2024-01-01', '2025-12-31', 3500, 7000, 200, 2, 'MONTHLY', 0.08, 3360, 'ACTIVE', true, '2023-12-20', true, '2023-12-21', NULL, NULL),
        ('CTR-2024-0002', $4, $5, $6, 'RESIDENTIAL', '2024-03-01', '2026-02-28', 2500, 5000, 150, 2, 'MONTHLY', 0.08, 2000, 'ACTIVE', true, '2024-02-15', true, '2024-02-16', NULL, NULL),
        ('CTR-2024-0003', $7, $2, $6, 'RESIDENTIAL', '2024-06-01', '2025-05-31', 4500, 9000, 300, 2, 'MONTHLY', 0.08, 0, 'PENDING_TENANT_CONFIRMATION', true, '2024-05-20', false, NULL, '123456', '2027-12-31')
      RETURNING id, contract_number
    `, [properties[0].id, landlord1.id, tenant1.id, properties[2].id, landlord2.id, tenant2.id, properties[1].id]);

    console.log('Contracts seeded:', contractsResult.rows.length);
    const contracts = contractsResult.rows;

    // Demo Payments
    await client.query(`
      INSERT INTO payments (payment_reference, contract_id, tenant_id, landlord_id, gross_amount, tax_amount, net_amount, platform_fee, period_start, period_end, payment_method, payment_provider, status, completed_at, settled_at)
      VALUES
        ('PAY-2024-0001', $1, $2, $3, 3500, 280, 3185, 35, '2024-01-01', '2024-01-31', 'MOBILE_MONEY', 'MTN', 'COMPLETED', '2024-01-05', '2024-01-06'),
        ('PAY-2024-0002', $1, $2, $3, 3500, 280, 3185, 35, '2024-02-01', '2024-02-29', 'MOBILE_MONEY', 'MTN', 'COMPLETED', '2024-02-03', '2024-02-04'),
        ('PAY-2024-0003', $4, $5, $6, 2500, 200, 2275, 25, '2024-03-01', '2024-03-31', 'MOBILE_MONEY', 'VODAFONE', 'COMPLETED', '2024-03-02', '2024-03-03')
    `, [contracts[0].id, tenant1.id, landlord1.id, contracts[1].id, tenant2.id, landlord2.id]);

    console.log('Payments seeded');

    // Demo Market Rent Data
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Market rent data using correct property type codes
    await client.query(`
      INSERT INTO market_rent_data (region, district, neighborhood, property_type, bedrooms, period_year, period_month, sample_size, average_rent, median_rent, min_rent, max_rent, percentile_10, percentile_90)
      VALUES
        ('Greater Accra', 'Accra Metropolitan', 'East Legon', 'R-3B', 3, $1, $2, 45, 4200, 4000, 2500, 7000, 2800, 6000),
        ('Greater Accra', 'Accra Metropolitan', 'Cantonments', 'R-3B', 3, $1, $2, 32, 5500, 5200, 3500, 9000, 4000, 7500),
        ('Greater Accra', 'Tema Metropolitan', 'Community 25', 'R-4B+', 4, $1, $2, 28, 3800, 3600, 2200, 6000, 2500, 5200),
        ('Ashanti', 'Kumasi Metropolitan', 'Ahodwo', 'R-2B', 2, $1, $2, 38, 2200, 2000, 1200, 3500, 1400, 3000),
        ('Ashanti', 'Kumasi Metropolitan', 'Nhyiaeso', 'R-3B', 3, $1, $2, 25, 2800, 2600, 1800, 4500, 2000, 3800),
        ('Greater Accra', 'Accra Metropolitan', 'Airport Residential', 'R-VL', 5, $1, $2, 18, 8500, 8000, 5500, 15000, 6000, 12000),
        ('Greater Accra', 'Accra Metropolitan', 'Osu', 'R-SR', 0, $1, $2, 42, 1800, 1700, 1000, 3000, 1200, 2500),
        ('Western', 'Sekondi-Takoradi Metropolitan', 'Beach Road', 'R-2B', 2, $1, $2, 22, 1600, 1500, 900, 2800, 1000, 2200)
    `, [currentYear, currentMonth]);

    console.log('Market data seeded');

    // Demo Inspection Cases
    await client.query(`
      INSERT INTO inspection_cases (case_number, property_id, assigned_inspector_id, case_type, priority, risk_score, source, description, status, assigned_at)
      VALUES
        ('INS-2024-0001', $1, $2, 'ROUTINE_INSPECTION', 'MEDIUM', 35, 'SYSTEM', 'Routine annual property inspection', 'ASSIGNED', CURRENT_TIMESTAMP),
        ('INS-2024-0002', $3, NULL, 'OWNERSHIP_VERIFICATION', 'HIGH', 72, 'ANONYMOUS_TIP', 'Reported suspicious ownership documentation', 'OPEN', NULL)
    `, [properties[0].id, inspector.id, properties[3].id]);

    console.log('Inspection cases seeded');

    // Demo Tax Certificate
    await client.query(`
      INSERT INTO tax_certificates (certificate_number, landlord_id, period_type, period_year, period_month, total_rent_received, total_tax_withheld, verification_code)
      VALUES ('CERT-2024-0001', $1, 'MONTHLY', 2024, 1, 3500, 280, 'VER-ABC123XYZ')
    `, [landlord1.id]);

    console.log('Tax certificates seeded');

    console.log('\n=== Database seeding completed! ===');
    console.log('\nDemo Credentials:');
    console.log('Landlord: landlord@demo.com / demo123');
    console.log('Tenant: tenant@demo.com / demo123');
    console.log('GRA Officer: gra@demo.com / demo123');
    console.log('Inspector: inspector@demo.com / demo123');
    console.log('Admin: admin@demo.com / admin123');

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
