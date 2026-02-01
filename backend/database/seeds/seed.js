const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../ghana_rental.db');

async function seed() {
  console.log('Seeding database...');

  const SQL = await initSqlJs();

  // Load existing database
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    console.error('Database not found. Run migrations first.');
    process.exit(1);
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash('demo123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // Demo Users
  const users = [
    {
      id: uuidv4(),
      email: 'kwame@demo.gh',
      phone: '+233241000001',
      password_hash: passwordHash,
      role: 'LANDLORD',
      first_name: 'Kwame',
      last_name: 'Asante',
      ghana_card_number: 'GHA-123456789-0',
      tin_number: 'P0012345678',
      digital_address: 'GA-123-4567',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    },
    {
      id: uuidv4(),
      email: 'ama@demo.gh',
      phone: '+233241000002',
      password_hash: passwordHash,
      role: 'TENANT',
      first_name: 'Ama',
      last_name: 'Mensah',
      ghana_card_number: 'GHA-987654321-0',
      digital_address: 'GA-234-5678',
      region: 'Greater Accra',
      district: 'Tema Metropolitan',
      city: 'Tema',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    },
    {
      id: uuidv4(),
      email: 'yaw@demo.gh',
      phone: '+233241000003',
      password_hash: passwordHash,
      role: 'LANDLORD',
      first_name: 'Yaw',
      last_name: 'Boateng',
      ghana_card_number: 'GHA-456789123-0',
      tin_number: 'P0023456789',
      digital_address: 'AS-456-7890',
      region: 'Ashanti',
      district: 'Kumasi Metropolitan',
      city: 'Kumasi',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    },
    {
      id: uuidv4(),
      email: 'kofi@demo.gh',
      phone: '+233241000004',
      password_hash: passwordHash,
      role: 'TENANT',
      first_name: 'Kofi',
      last_name: 'Owusu',
      ghana_card_number: 'GHA-789123456-0',
      digital_address: 'AS-567-8901',
      region: 'Ashanti',
      district: 'Kumasi Metropolitan',
      city: 'Kumasi',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    },
    {
      id: uuidv4(),
      email: 'gra@demo.gh',
      phone: '+233241000005',
      password_hash: passwordHash,
      role: 'GRA_OFFICER',
      first_name: 'Grace',
      last_name: 'Addo',
      ghana_card_number: 'GHA-111222333-0',
      digital_address: 'GA-678-9012',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    },
    {
      id: uuidv4(),
      email: 'inspector@demo.gh',
      phone: '+233241000006',
      password_hash: passwordHash,
      role: 'INSPECTOR',
      first_name: 'Isaac',
      last_name: 'Nkrumah',
      ghana_card_number: 'GHA-444555666-0',
      digital_address: 'GA-789-0123',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    },
    {
      id: uuidv4(),
      email: 'supervisor@demo.gh',
      phone: '+233241000007',
      password_hash: passwordHash,
      role: 'GRA_SUPERVISOR',
      first_name: 'Sarah',
      last_name: 'Danso',
      ghana_card_number: 'GHA-777888999-0',
      digital_address: 'GA-890-1234',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    },
    {
      id: uuidv4(),
      email: 'admin@demo.gh',
      phone: '+233241000008',
      password_hash: adminPasswordHash,
      role: 'ADMIN',
      first_name: 'Admin',
      last_name: 'User',
      ghana_card_number: 'GHA-000000001-0',
      digital_address: 'GA-000-0001',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      status: 'ACTIVE',
      verification_status: 'VERIFIED'
    }
  ];

  // Insert users
  for (const user of users) {
    db.run(`
      INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name,
        ghana_card_number, tin_number, digital_address, region, district, city, status, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.id, user.email, user.phone, user.password_hash, user.role, user.first_name,
        user.last_name, user.ghana_card_number, user.tin_number || null, user.digital_address,
        user.region, user.district, user.city, user.status, user.verification_status]);
  }

  console.log('Users seeded');

  // Get landlord IDs
  const landlord1 = users[0];
  const landlord2 = users[2];
  const tenant1 = users[1];
  const tenant2 = users[3];
  const inspector = users[5];

  // Demo Properties
  const properties = [
    {
      id: uuidv4(),
      landlord_id: landlord1.id,
      property_code: 'PROP-ACC-001',
      digital_address: 'GA-123-4567',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      neighborhood: 'East Legon',
      property_type: 'APARTMENT',
      property_category: 'RESIDENTIAL',
      bedrooms: 3,
      bathrooms: 2,
      floor_area_sqm: 120,
      year_built: 2020,
      is_furnished: 1,
      has_parking: 1,
      has_security: 1,
      has_generator: 0,
      ownership_type: 'FREEHOLD',
      ownership_verified: 1,
      status: 'VERIFIED',
      is_available: 0
    },
    {
      id: uuidv4(),
      landlord_id: landlord1.id,
      property_code: 'PROP-ACC-002',
      digital_address: 'GA-234-5678',
      region: 'Greater Accra',
      district: 'Tema Metropolitan',
      city: 'Tema',
      neighborhood: 'Community 25',
      property_type: 'HOUSE',
      property_category: 'RESIDENTIAL',
      bedrooms: 4,
      bathrooms: 3,
      floor_area_sqm: 200,
      year_built: 2018,
      is_furnished: 0,
      has_parking: 1,
      has_security: 1,
      has_generator: 1,
      ownership_type: 'FREEHOLD',
      ownership_verified: 1,
      status: 'VERIFIED',
      is_available: 1
    },
    {
      id: uuidv4(),
      landlord_id: landlord2.id,
      property_code: 'PROP-KUM-001',
      digital_address: 'AS-345-6789',
      region: 'Ashanti',
      district: 'Kumasi Metropolitan',
      city: 'Kumasi',
      neighborhood: 'Ahodwo',
      property_type: 'APARTMENT',
      property_category: 'RESIDENTIAL',
      bedrooms: 2,
      bathrooms: 2,
      floor_area_sqm: 85,
      year_built: 2021,
      is_furnished: 1,
      has_parking: 1,
      has_security: 0,
      has_generator: 0,
      ownership_type: 'LEASEHOLD',
      ownership_verified: 1,
      status: 'VERIFIED',
      is_available: 0
    },
    {
      id: uuidv4(),
      landlord_id: landlord2.id,
      property_code: 'PROP-KUM-002',
      digital_address: 'AS-456-7890',
      region: 'Ashanti',
      district: 'Kumasi Metropolitan',
      city: 'Kumasi',
      neighborhood: 'Nhyiaeso',
      property_type: 'OFFICE',
      property_category: 'COMMERCIAL',
      bedrooms: 0,
      bathrooms: 2,
      floor_area_sqm: 150,
      year_built: 2019,
      is_furnished: 0,
      has_parking: 1,
      has_security: 1,
      has_generator: 1,
      ownership_type: 'FREEHOLD',
      ownership_verified: 0,
      status: 'PENDING_VERIFICATION',
      is_available: 1
    },
    {
      id: uuidv4(),
      landlord_id: landlord1.id,
      property_code: 'PROP-ACC-003',
      digital_address: 'GA-567-8901',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      neighborhood: 'Cantonments',
      property_type: 'TOWNHOUSE',
      property_category: 'RESIDENTIAL',
      bedrooms: 5,
      bathrooms: 4,
      floor_area_sqm: 300,
      year_built: 2022,
      is_furnished: 1,
      has_parking: 1,
      has_security: 1,
      has_generator: 1,
      ownership_type: 'FREEHOLD',
      ownership_verified: 1,
      status: 'VERIFIED',
      is_available: 1
    }
  ];

  // Insert properties
  for (const prop of properties) {
    db.run(`
      INSERT INTO properties (id, landlord_id, property_code, digital_address, region, district,
        city, neighborhood, property_type, property_category, bedrooms, bathrooms, floor_area_sqm,
        year_built, is_furnished, has_parking, has_security, has_generator, ownership_type,
        ownership_verified, status, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [prop.id, prop.landlord_id, prop.property_code, prop.digital_address, prop.region,
        prop.district, prop.city, prop.neighborhood, prop.property_type, prop.property_category,
        prop.bedrooms, prop.bathrooms, prop.floor_area_sqm, prop.year_built, prop.is_furnished,
        prop.has_parking, prop.has_security, prop.has_generator, prop.ownership_type,
        prop.ownership_verified, prop.status, prop.is_available]);
  }

  console.log('Properties seeded');

  // Demo Contracts
  const contracts = [
    {
      id: uuidv4(),
      contract_number: 'CTR-2024-0001',
      property_id: properties[0].id,
      landlord_id: landlord1.id,
      tenant_id: tenant1.id,
      contract_type: 'RESIDENTIAL',
      start_date: '2024-01-01',
      end_date: '2025-12-31',
      monthly_rent: 3500,
      security_deposit: 7000,
      service_charge: 200,
      advance_months: 2,
      payment_frequency: 'MONTHLY',
      tax_rate: 0.08,
      total_tax_withheld: 3360,
      status: 'ACTIVE',
      landlord_signed: 1,
      landlord_signed_at: '2023-12-20',
      tenant_confirmed: 1,
      tenant_confirmed_at: '2023-12-21'
    },
    {
      id: uuidv4(),
      contract_number: 'CTR-2024-0002',
      property_id: properties[2].id,
      landlord_id: landlord2.id,
      tenant_id: tenant2.id,
      contract_type: 'RESIDENTIAL',
      start_date: '2024-03-01',
      end_date: '2026-02-28',
      monthly_rent: 2500,
      security_deposit: 5000,
      service_charge: 150,
      advance_months: 2,
      payment_frequency: 'MONTHLY',
      tax_rate: 0.08,
      total_tax_withheld: 2000,
      status: 'ACTIVE',
      landlord_signed: 1,
      landlord_signed_at: '2024-02-15',
      tenant_confirmed: 1,
      tenant_confirmed_at: '2024-02-16'
    },
    {
      id: uuidv4(),
      contract_number: 'CTR-2024-0003',
      property_id: properties[1].id,
      landlord_id: landlord1.id,
      tenant_id: tenant2.id,
      contract_type: 'RESIDENTIAL',
      start_date: '2024-06-01',
      end_date: '2025-05-31',
      monthly_rent: 4500,
      security_deposit: 9000,
      service_charge: 300,
      advance_months: 2,
      payment_frequency: 'MONTHLY',
      tax_rate: 0.08,
      total_tax_withheld: 0,
      status: 'PENDING_TENANT_CONFIRMATION',
      landlord_signed: 1,
      landlord_signed_at: '2024-05-20',
      tenant_confirmed: 0,
      confirmation_code: '123456',
      confirmation_expires_at: '2024-12-31'
    }
  ];

  // Insert contracts
  for (const contract of contracts) {
    db.run(`
      INSERT INTO contracts (id, contract_number, property_id, landlord_id, tenant_id, contract_type,
        start_date, end_date, monthly_rent, security_deposit, service_charge, advance_months,
        payment_frequency, tax_rate, total_tax_withheld, status, landlord_signed, landlord_signed_at,
        tenant_confirmed, tenant_confirmed_at, confirmation_code, confirmation_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [contract.id, contract.contract_number, contract.property_id, contract.landlord_id,
        contract.tenant_id, contract.contract_type, contract.start_date, contract.end_date,
        contract.monthly_rent, contract.security_deposit, contract.service_charge, contract.advance_months,
        contract.payment_frequency, contract.tax_rate, contract.total_tax_withheld, contract.status,
        contract.landlord_signed, contract.landlord_signed_at, contract.tenant_confirmed,
        contract.tenant_confirmed_at || null, contract.confirmation_code || null,
        contract.confirmation_expires_at || null]);
  }

  console.log('Contracts seeded');

  // Demo Payments
  const payments = [
    {
      id: uuidv4(),
      payment_reference: 'PAY-2024-0001',
      contract_id: contracts[0].id,
      tenant_id: tenant1.id,
      landlord_id: landlord1.id,
      gross_amount: 3500,
      tax_amount: 280,
      net_amount: 3185,
      platform_fee: 35,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      payment_method: 'MOBILE_MONEY',
      payment_provider: 'MTN',
      status: 'COMPLETED',
      completed_at: '2024-01-05',
      settled_at: '2024-01-06'
    },
    {
      id: uuidv4(),
      payment_reference: 'PAY-2024-0002',
      contract_id: contracts[0].id,
      tenant_id: tenant1.id,
      landlord_id: landlord1.id,
      gross_amount: 3500,
      tax_amount: 280,
      net_amount: 3185,
      platform_fee: 35,
      period_start: '2024-02-01',
      period_end: '2024-02-29',
      payment_method: 'MOBILE_MONEY',
      payment_provider: 'MTN',
      status: 'COMPLETED',
      completed_at: '2024-02-03',
      settled_at: '2024-02-04'
    },
    {
      id: uuidv4(),
      payment_reference: 'PAY-2024-0003',
      contract_id: contracts[1].id,
      tenant_id: tenant2.id,
      landlord_id: landlord2.id,
      gross_amount: 2500,
      tax_amount: 200,
      net_amount: 2275,
      platform_fee: 25,
      period_start: '2024-03-01',
      period_end: '2024-03-31',
      payment_method: 'MOBILE_MONEY',
      payment_provider: 'VODAFONE',
      status: 'COMPLETED',
      completed_at: '2024-03-02',
      settled_at: '2024-03-03'
    }
  ];

  // Insert payments
  for (const payment of payments) {
    db.run(`
      INSERT INTO payments (id, payment_reference, contract_id, tenant_id, landlord_id,
        gross_amount, tax_amount, net_amount, platform_fee, period_start, period_end,
        payment_method, payment_provider, status, completed_at, settled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [payment.id, payment.payment_reference, payment.contract_id, payment.tenant_id,
        payment.landlord_id, payment.gross_amount, payment.tax_amount, payment.net_amount,
        payment.platform_fee, payment.period_start, payment.period_end, payment.payment_method,
        payment.payment_provider, payment.status, payment.completed_at, payment.settled_at]);
  }

  console.log('Payments seeded');

  // Demo Market Rent Data
  const marketData = [
    { region: 'Greater Accra', district: 'Accra Metropolitan', neighborhood: 'East Legon',
      property_type: 'APARTMENT', bedrooms: 3, sample_size: 45, average_rent: 4200,
      median_rent: 4000, min_rent: 2500, max_rent: 7000, percentile_10: 2800, percentile_90: 6000 },
    { region: 'Greater Accra', district: 'Accra Metropolitan', neighborhood: 'Cantonments',
      property_type: 'APARTMENT', bedrooms: 3, sample_size: 32, average_rent: 5500,
      median_rent: 5200, min_rent: 3500, max_rent: 9000, percentile_10: 4000, percentile_90: 7500 },
    { region: 'Greater Accra', district: 'Tema Metropolitan', neighborhood: 'Community 25',
      property_type: 'HOUSE', bedrooms: 4, sample_size: 28, average_rent: 3800,
      median_rent: 3600, min_rent: 2200, max_rent: 6000, percentile_10: 2500, percentile_90: 5200 },
    { region: 'Ashanti', district: 'Kumasi Metropolitan', neighborhood: 'Ahodwo',
      property_type: 'APARTMENT', bedrooms: 2, sample_size: 38, average_rent: 2200,
      median_rent: 2000, min_rent: 1200, max_rent: 3500, percentile_10: 1400, percentile_90: 3000 },
    { region: 'Ashanti', district: 'Kumasi Metropolitan', neighborhood: 'Nhyiaeso',
      property_type: 'APARTMENT', bedrooms: 3, sample_size: 25, average_rent: 2800,
      median_rent: 2600, min_rent: 1800, max_rent: 4500, percentile_10: 2000, percentile_90: 3800 },
    { region: 'Greater Accra', district: 'Accra Metropolitan', neighborhood: 'Airport Residential',
      property_type: 'TOWNHOUSE', bedrooms: 5, sample_size: 18, average_rent: 8500,
      median_rent: 8000, min_rent: 5500, max_rent: 15000, percentile_10: 6000, percentile_90: 12000 },
    { region: 'Greater Accra', district: 'Accra Metropolitan', neighborhood: 'Osu',
      property_type: 'STUDIO', bedrooms: 0, sample_size: 42, average_rent: 1800,
      median_rent: 1700, min_rent: 1000, max_rent: 3000, percentile_10: 1200, percentile_90: 2500 },
    { region: 'Western', district: 'Sekondi-Takoradi Metropolitan', neighborhood: 'Beach Road',
      property_type: 'APARTMENT', bedrooms: 2, sample_size: 22, average_rent: 1600,
      median_rent: 1500, min_rent: 900, max_rent: 2800, percentile_10: 1000, percentile_90: 2200 }
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  for (const data of marketData) {
    db.run(`
      INSERT INTO market_rent_data (id, region, district, neighborhood, property_type, bedrooms,
        period_year, period_month, sample_size, average_rent, median_rent, min_rent, max_rent,
        percentile_10, percentile_90)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), data.region, data.district, data.neighborhood, data.property_type,
        data.bedrooms, currentYear, currentMonth, data.sample_size, data.average_rent,
        data.median_rent, data.min_rent, data.max_rent, data.percentile_10, data.percentile_90]);
  }

  console.log('Market data seeded');

  // Demo Inspection Cases
  const cases = [
    {
      id: uuidv4(),
      case_number: 'INS-2024-0001',
      property_id: properties[0].id,
      assigned_inspector_id: inspector.id,
      case_type: 'ROUTINE_INSPECTION',
      priority: 'MEDIUM',
      risk_score: 35,
      source: 'SYSTEM',
      description: 'Routine annual property inspection',
      status: 'ASSIGNED',
      assigned_at: now
    },
    {
      id: uuidv4(),
      case_number: 'INS-2024-0002',
      property_id: properties[3].id,
      case_type: 'OWNERSHIP_VERIFICATION',
      priority: 'HIGH',
      risk_score: 72,
      source: 'ANONYMOUS_TIP',
      description: 'Reported suspicious ownership documentation',
      status: 'OPEN'
    }
  ];

  for (const caseItem of cases) {
    db.run(`
      INSERT INTO inspection_cases (id, case_number, property_id, assigned_inspector_id,
        case_type, priority, risk_score, source, description, status, assigned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [caseItem.id, caseItem.case_number, caseItem.property_id, caseItem.assigned_inspector_id || null,
        caseItem.case_type, caseItem.priority, caseItem.risk_score, caseItem.source,
        caseItem.description, caseItem.status, caseItem.assigned_at || null]);
  }

  console.log('Inspection cases seeded');

  // Demo Tax Certificate
  const taxCert = {
    id: uuidv4(),
    certificate_number: 'CERT-2024-0001',
    landlord_id: landlord1.id,
    period_type: 'MONTHLY',
    period_year: 2024,
    period_month: 1,
    total_rent_received: 3500,
    total_tax_withheld: 280,
    verification_code: 'VER-ABC123XYZ'
  };

  db.run(`
    INSERT INTO tax_certificates (id, certificate_number, landlord_id, period_type, period_year,
      period_month, total_rent_received, total_tax_withheld, verification_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [taxCert.id, taxCert.certificate_number, taxCert.landlord_id, taxCert.period_type,
      taxCert.period_year, taxCert.period_month, taxCert.total_rent_received,
      taxCert.total_tax_withheld, taxCert.verification_code]);

  console.log('Tax certificates seeded');

  // Save to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('Database seeding completed!');
  console.log('\nDemo Credentials:');
  console.log('Landlord: kwame@demo.gh / demo123');
  console.log('Tenant: ama@demo.gh / demo123');
  console.log('GRA Officer: gra@demo.gh / demo123');
  console.log('Inspector: inspector@demo.gh / demo123');
  console.log('Admin: admin@demo.gh / admin123');

  db.close();
}

seed().catch(console.error);
