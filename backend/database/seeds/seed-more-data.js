const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
});

// Ghana-specific data for realistic names and locations
const ghanaFirstNames = [
  'Kwame', 'Kofi', 'Yaw', 'Kweku', 'Kwabena', 'Akwasi', 'Kojo',
  'Ama', 'Akua', 'Yaa', 'Afia', 'Abena', 'Akosua', 'Adjoa',
  'Nana', 'Osei', 'Mensah', 'Owusu', 'Asante', 'Boateng', 'Frimpong',
  'Efua', 'Adwoa', 'Esi', 'Afua', 'Araba', 'Ekua', 'Aba',
  'Daniel', 'Emmanuel', 'Samuel', 'Joseph', 'Michael', 'David', 'Isaac',
  'Grace', 'Comfort', 'Patience', 'Gifty', 'Mercy', 'Gloria', 'Joyce'
];

const ghanaLastNames = [
  'Asante', 'Mensah', 'Boateng', 'Owusu', 'Osei', 'Agyeman', 'Frimpong',
  'Addo', 'Kumi', 'Acheampong', 'Nkrumah', 'Appiah', 'Adjei', 'Asamoah',
  'Danso', 'Darko', 'Gyamfi', 'Kwarteng', 'Tetteh', 'Ansah', 'Amankwah',
  'Yeboah', 'Ofori', 'Bonsu', 'Amponsah', 'Sarpong', 'Amoako', 'Badu',
  'Aidoo', 'Asare', 'Baffoe', 'Okyere', 'Opoku', 'Quayson', 'Yankah'
];

const regions = [
  { name: 'Greater Accra', districts: ['Accra Metropolitan', 'Tema Metropolitan', 'Ga East', 'Ga West'], cities: ['Accra', 'Tema', 'Madina', 'Kasoa'] },
  { name: 'Ashanti', districts: ['Kumasi Metropolitan', 'Obuasi Municipal', 'Ejisu Municipal'], cities: ['Kumasi', 'Obuasi', 'Ejisu'] },
  { name: 'Western', districts: ['Sekondi-Takoradi Metropolitan', 'Tarkwa-Nsuaem'], cities: ['Takoradi', 'Tarkwa'] },
  { name: 'Eastern', districts: ['New Juaben Municipal', 'Akim Oda'], cities: ['Koforidua', 'Akim Oda'] },
  { name: 'Central', districts: ['Cape Coast Metropolitan', 'KEEA Municipal'], cities: ['Cape Coast', 'Elmina'] },
  { name: 'Northern', districts: ['Tamale Metropolitan', 'Sagnarigu'], cities: ['Tamale', 'Sagnarigu'] },
];

const neighborhoods = [
  'East Legon', 'Airport City', 'Cantonments', 'Osu', 'Labone', 'Roman Ridge', 'Dzorwulu',
  'Achimota', 'Madina', 'Adenta', 'Teshie', 'Tema Community 25', 'Sakumono', 'Spintex',
  'Ahodwo', 'Nhyiaeso', 'Bantama', 'Asokwa', 'Ayigya', 'Kotei',
  'Beach Road', 'Anaji', 'Chapel Hill', 'Fijai', 'Effia'
];

const propertyTypes = [
  { code: 'R-SR', name: 'Single Room', category: 'RESIDENTIAL', bedrooms: 0, bathrooms: 1, minRent: 300, maxRent: 800 },
  { code: 'R-SC', name: 'Self-Contained', category: 'RESIDENTIAL', bedrooms: 1, bathrooms: 1, minRent: 500, maxRent: 1200 },
  { code: 'R-1B', name: '1-Bedroom', category: 'RESIDENTIAL', bedrooms: 1, bathrooms: 1, minRent: 800, maxRent: 2000 },
  { code: 'R-2B', name: '2-Bedroom', category: 'RESIDENTIAL', bedrooms: 2, bathrooms: 2, minRent: 1200, maxRent: 3500 },
  { code: 'R-3B', name: '3-Bedroom', category: 'RESIDENTIAL', bedrooms: 3, bathrooms: 2, minRent: 2000, maxRent: 5000 },
  { code: 'R-4B+', name: '4+ Bedroom', category: 'RESIDENTIAL', bedrooms: 4, bathrooms: 3, minRent: 3500, maxRent: 8000 },
  { code: 'C-OFF', name: 'Office', category: 'COMMERCIAL', bedrooms: 0, bathrooms: 2, minRent: 2000, maxRent: 6000 },
  { code: 'C-SHP', name: 'Shop', category: 'COMMERCIAL', bedrooms: 0, bathrooms: 1, minRent: 800, maxRent: 3000 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateGhanaCardNumber() {
  const prefix = 'GHA';
  const digits = String(randomInt(100000000, 999999999));
  const check = randomInt(0, 9);
  return `${prefix}-${digits}-${check}`;
}

function generateTIN() {
  return 'P00' + String(randomInt(10000000, 99999999));
}

function generateDigitalAddress(region) {
  const prefixes = { 'Greater Accra': 'GA', 'Ashanti': 'AS', 'Western': 'WS', 'Eastern': 'ER', 'Central': 'CR', 'Northern': 'NR' };
  const prefix = prefixes[region] || 'GH';
  return `${prefix}-${randomInt(100, 999)}-${randomInt(1000, 9999)}`;
}

function generatePropertyCode(region, index) {
  const prefixes = { 'Greater Accra': 'ACC', 'Ashanti': 'KUM', 'Western': 'TAK', 'Eastern': 'KOF', 'Central': 'CAP', 'Northern': 'TAM' };
  const prefix = prefixes[region] || 'GH';
  return `GRE-${prefix}-GA-${randomInt(100, 999)}-${randomInt(1000, 9999)}-${String(index).padStart(2, '0')}`;
}

function generateContractNumber(year, month, index) {
  return `CTR-${year}-${String(index).padStart(5, '0')}`;
}

function generatePaymentReference(year, month, index) {
  return `PAY-${year}-${String(index).padStart(4, '0')}`;
}

async function seedMoreData() {
  console.log('🌱 Seeding additional data...\n');

  const client = await pool.connect();
  const passwordHash = await bcrypt.hash('demo123', 10);

  try {
    // Check existing counts
    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    const existingProperties = await client.query('SELECT COUNT(*) FROM properties');
    const existingContracts = await client.query('SELECT COUNT(*) FROM contracts');
    const existingPayments = await client.query('SELECT COUNT(*) FROM payments');

    console.log('📊 Current database state:');
    console.log(`   Users: ${existingUsers.rows[0].count}`);
    console.log(`   Properties: ${existingProperties.rows[0].count}`);
    console.log(`   Contracts: ${existingContracts.rows[0].count}`);
    console.log(`   Payments: ${existingPayments.rows[0].count}`);
    console.log('');

    // ===== CREATE MORE LANDLORDS =====
    console.log('👤 Creating landlords...');
    const landlordIds = [];
    const numLandlords = 50;

    for (let i = 0; i < numLandlords; i++) {
      const firstName = randomElement(ghanaFirstNames);
      const lastName = randomElement(ghanaLastNames);
      const region = randomElement(regions);
      const district = randomElement(region.districts);
      const city = randomElement(region.cities);
      const email = `landlord${i + 100}@demo.com`;
      const phone = `+2332410${String(10000 + i).slice(-5)}`;

      try {
        const result = await client.query(`
          INSERT INTO users (email, phone, password_hash, role, first_name, last_name, ghana_card_number, tin_number, digital_address, region, district, city, status, verification_status)
          VALUES ($1, $2, $3, 'LANDLORD_INDIVIDUAL', $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE', 'VERIFIED')
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `, [email, phone, passwordHash, firstName, lastName, generateGhanaCardNumber(), generateTIN(), generateDigitalAddress(region.name), region.name, district, city]);

        if (result.rows[0]) {
          landlordIds.push(result.rows[0].id);
        }
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ Created ${landlordIds.length} new landlords`);

    // Get all landlords (existing + new)
    const allLandlords = await client.query(`SELECT id FROM users WHERE role = 'LANDLORD_INDIVIDUAL'`);
    const allLandlordIds = allLandlords.rows.map(r => r.id);

    // ===== CREATE MORE TENANTS =====
    console.log('👤 Creating tenants...');
    const tenantIds = [];
    const numTenants = 150;

    for (let i = 0; i < numTenants; i++) {
      const firstName = randomElement(ghanaFirstNames);
      const lastName = randomElement(ghanaLastNames);
      const region = randomElement(regions);
      const district = randomElement(region.districts);
      const city = randomElement(region.cities);
      const email = `tenant${i + 100}@demo.com`;
      const phone = `+2332420${String(10000 + i).slice(-5)}`;

      try {
        const result = await client.query(`
          INSERT INTO users (email, phone, password_hash, role, first_name, last_name, ghana_card_number, digital_address, region, district, city, status, verification_status)
          VALUES ($1, $2, $3, 'TENANT_INDIVIDUAL', $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', 'VERIFIED')
          ON CONFLICT (email) DO NOTHING
          RETURNING id
        `, [email, phone, passwordHash, firstName, lastName, generateGhanaCardNumber(), generateDigitalAddress(region.name), region.name, district, city]);

        if (result.rows[0]) {
          tenantIds.push(result.rows[0].id);
        }
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ Created ${tenantIds.length} new tenants`);

    // Get all tenants
    const allTenants = await client.query(`SELECT id FROM users WHERE role = 'TENANT_INDIVIDUAL'`);
    const allTenantIds = allTenants.rows.map(r => r.id);

    // ===== CREATE MORE PROPERTIES =====
    console.log('🏠 Creating properties...');
    const propertyIds = [];
    const numProperties = 100;

    for (let i = 0; i < numProperties; i++) {
      const landlordId = randomElement(allLandlordIds);
      const region = randomElement(regions);
      const district = randomElement(region.districts);
      const city = randomElement(region.cities);
      const neighborhood = randomElement(neighborhoods);
      const propertyType = randomElement(propertyTypes);
      const propertyCode = generatePropertyCode(region.name, i);

      try {
        const result = await client.query(`
          INSERT INTO properties (landlord_id, property_code, digital_address, region, district, city, neighborhood, property_type, property_category, bedrooms, bathrooms, floor_area_sqm, year_built, is_furnished, has_parking, has_security, has_generator, ownership_type, ownership_verified, status, is_available)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'VERIFIED', $20)
          ON CONFLICT (property_code) DO NOTHING
          RETURNING id, landlord_id, property_type
        `, [
          landlordId, propertyCode, generateDigitalAddress(region.name),
          region.name, district, city, neighborhood,
          propertyType.code, propertyType.category,
          propertyType.bedrooms, propertyType.bathrooms,
          randomInt(40, 300), randomInt(2010, 2024),
          Math.random() > 0.5, Math.random() > 0.3, Math.random() > 0.4, Math.random() > 0.7,
          Math.random() > 0.3 ? 'FREEHOLD' : 'LEASEHOLD', true,
          Math.random() > 0.3 // is_available
        ]);

        if (result.rows[0]) {
          propertyIds.push(result.rows[0]);
        }
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✅ Created ${propertyIds.length} new properties`);

    // Get all available properties with their landlords
    const availableProperties = await client.query(`
      SELECT p.id, p.landlord_id, p.property_type
      FROM properties p
      WHERE p.is_available = true AND p.status = 'VERIFIED'
    `);

    // ===== CREATE CONTRACTS (One tenant = One contract) =====
    console.log('📝 Creating contracts...');

    // Get tenants who don't have active contracts
    const tenantsWithContracts = await client.query(`
      SELECT DISTINCT tenant_id FROM contracts WHERE status IN ('ACTIVE', 'PENDING_TENANT_CONFIRMATION')
    `);
    const usedTenantIds = new Set(tenantsWithContracts.rows.map(r => r.tenant_id));
    const availableTenantIds = allTenantIds.filter(id => !usedTenantIds.has(id));

    let contractIndex = parseInt(existingContracts.rows[0].count) + 1;
    const newContracts = [];
    const usedPropertyIds = new Set();

    // Get property type rent ranges
    const propertyTypeMap = {};
    propertyTypes.forEach(pt => {
      propertyTypeMap[pt.code] = pt;
    });

    for (const tenantId of availableTenantIds) {
      // Find an available property
      const availableProp = availableProperties.rows.find(p => !usedPropertyIds.has(p.id));
      if (!availableProp) break;

      usedPropertyIds.add(availableProp.id);
      const propType = propertyTypeMap[availableProp.property_type] || propertyTypes[4]; // Default to 3-bedroom
      const monthlyRent = randomInt(propType.minRent, propType.maxRent);

      // Random start date in past 6 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - randomInt(0, 6));
      startDate.setDate(1);

      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + randomInt(1, 2));

      const isActive = Math.random() > 0.15;
      const contractNumber = generateContractNumber(startDate.getFullYear(), startDate.getMonth() + 1, contractIndex++);

      try {
        const result = await client.query(`
          INSERT INTO contracts (contract_number, property_id, landlord_id, tenant_id, contract_type, start_date, end_date, monthly_rent, security_deposit, service_charge, advance_months, payment_frequency, tax_rate, total_tax_withheld, status, landlord_signed, landlord_signed_at, tenant_confirmed, tenant_confirmed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'MONTHLY', 0.08, 0, $12, true, $13, $14, $15)
          RETURNING id, contract_number, property_id, landlord_id, tenant_id, monthly_rent, start_date, end_date
        `, [
          contractNumber, availableProp.id, availableProp.landlord_id, tenantId,
          propType.category === 'COMMERCIAL' ? 'COMMERCIAL' : 'RESIDENTIAL',
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          monthlyRent,
          monthlyRent * 2, // security deposit
          randomInt(50, 300), // service charge
          randomInt(1, 3), // advance months
          isActive ? 'ACTIVE' : 'PENDING_TENANT_CONFIRMATION',
          startDate.toISOString(),
          isActive, isActive ? startDate.toISOString() : null
        ]);

        if (result.rows[0]) {
          newContracts.push(result.rows[0]);

          // Mark property as not available if contract is active
          if (isActive) {
            await client.query(`UPDATE properties SET is_available = false WHERE id = $1`, [availableProp.id]);
          }
        }
      } catch (e) {
        console.error(`   ⚠️ Contract error: ${e.message}`);
      }
    }
    console.log(`   ✅ Created ${newContracts.length} new contracts`);

    // ===== CREATE PAYMENTS FOR CONTRACTS =====
    console.log('💰 Creating payments...');
    let paymentIndex = parseInt(existingPayments.rows[0].count) + 1;
    let totalPayments = 0;
    let totalTaxCollected = 0;

    // Get all active contracts
    const activeContracts = await client.query(`
      SELECT id, contract_number, property_id, landlord_id, tenant_id, monthly_rent, start_date, end_date
      FROM contracts WHERE status = 'ACTIVE'
    `);

    for (const contract of activeContracts.rows) {
      const startDate = new Date(contract.start_date);
      const now = new Date();

      // Generate payments from start date to now
      const currentDate = new Date(startDate);

      while (currentDate <= now && currentDate < new Date(contract.end_date)) {
        const periodStart = new Date(currentDate);
        const periodEnd = new Date(currentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0); // Last day of the month

        const grossAmount = contract.monthly_rent;
        const taxAmount = Math.round(grossAmount * 0.08 * 100) / 100; // 8% tax
        const platformFee = Math.round(grossAmount * 0.01 * 100) / 100; // 1% platform fee
        const netAmount = grossAmount - taxAmount - platformFee;

        const paymentRef = generatePaymentReference(periodStart.getFullYear(), periodStart.getMonth() + 1, paymentIndex++);
        const paymentMethods = ['MOBILE_MONEY', 'BANK_TRANSFER', 'CARD'];
        const providers = ['MTN', 'VODAFONE', 'AIRTELTIGO', 'GCB', 'ECOBANK'];

        try {
          await client.query(`
            INSERT INTO payments (payment_reference, contract_id, tenant_id, landlord_id, gross_amount, tax_amount, net_amount, platform_fee, period_start, period_end, payment_method, payment_provider, status, completed_at, settled_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'COMPLETED', $13, $14)
            ON CONFLICT (payment_reference) DO NOTHING
          `, [
            paymentRef, contract.id, contract.tenant_id, contract.landlord_id,
            grossAmount, taxAmount, netAmount, platformFee,
            periodStart.toISOString().split('T')[0],
            periodEnd.toISOString().split('T')[0],
            randomElement(paymentMethods), randomElement(providers),
            new Date(periodStart.getTime() + randomInt(1, 5) * 24 * 60 * 60 * 1000).toISOString(),
            new Date(periodStart.getTime() + randomInt(2, 7) * 24 * 60 * 60 * 1000).toISOString()
          ]);

          totalPayments++;
          totalTaxCollected += taxAmount;
        } catch (e) {
          // Skip duplicates
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    console.log(`   ✅ Created ${totalPayments} new payments`);
    console.log(`   💵 Total tax collected: GHS ${totalTaxCollected.toFixed(2)}`);

    // ===== UPDATE CONTRACT TAX TOTALS =====
    console.log('📊 Updating contract tax totals...');
    await client.query(`
      UPDATE contracts c SET total_tax_withheld = COALESCE((
        SELECT SUM(tax_amount) FROM payments WHERE contract_id = c.id AND status = 'COMPLETED'
      ), 0)
    `);

    // ===== FINAL COUNTS =====
    const finalUsers = await client.query('SELECT COUNT(*) FROM users');
    const finalLandlords = await client.query("SELECT COUNT(*) FROM users WHERE role = 'LANDLORD_INDIVIDUAL'");
    const finalTenants = await client.query("SELECT COUNT(*) FROM users WHERE role = 'TENANT_INDIVIDUAL'");
    const finalProperties = await client.query('SELECT COUNT(*) FROM properties');
    const finalContracts = await client.query('SELECT COUNT(*) FROM contracts');
    const finalPayments = await client.query('SELECT COUNT(*) FROM payments');
    const taxTotal = await client.query('SELECT SUM(tax_amount) as total FROM payments WHERE status = $1', ['COMPLETED']);

    console.log('\n' + '='.repeat(50));
    console.log('📊 FINAL DATABASE STATE:');
    console.log('='.repeat(50));
    console.log(`   Total Users: ${finalUsers.rows[0].count}`);
    console.log(`   - Landlords: ${finalLandlords.rows[0].count}`);
    console.log(`   - Tenants: ${finalTenants.rows[0].count}`);
    console.log(`   Properties: ${finalProperties.rows[0].count}`);
    console.log(`   Contracts: ${finalContracts.rows[0].count}`);
    console.log(`   Payments: ${finalPayments.rows[0].count}`);
    console.log(`   Total Tax Collected: GHS ${parseFloat(taxTotal.rows[0].total || 0).toFixed(2)}`);
    console.log('='.repeat(50));
    console.log('\n✅ Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedMoreData().catch(console.error);
