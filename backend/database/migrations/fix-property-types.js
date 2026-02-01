const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixPropertyTypes() {
  console.log('Fixing property types in database...');

  const client = await pool.connect();

  try {
    // Update property types to use correct codes
    await client.query(`
      UPDATE properties SET property_type = 'R-3B' WHERE property_type = 'APARTMENT' AND bedrooms = 3;
    `);
    await client.query(`
      UPDATE properties SET property_type = 'R-2B' WHERE property_type = 'APARTMENT' AND bedrooms = 2;
    `);
    await client.query(`
      UPDATE properties SET property_type = 'R-4B+' WHERE property_type = 'HOUSE' AND bedrooms >= 4;
    `);
    await client.query(`
      UPDATE properties SET property_type = 'R-HS' WHERE property_type = 'HOUSE' AND bedrooms < 4;
    `);
    await client.query(`
      UPDATE properties SET property_type = 'R-VL' WHERE property_type = 'TOWNHOUSE';
    `);
    await client.query(`
      UPDATE properties SET property_type = 'C-OFF' WHERE property_type = 'OFFICE';
    `);

    // Extend confirmation expiry for pending contracts
    await client.query(`
      UPDATE contracts
      SET confirmation_expires_at = '2027-12-31'
      WHERE status = 'PENDING_TENANT_CONFIRMATION';
    `);

    // Update market rent data
    await client.query(`
      UPDATE market_rent_data SET property_type = 'R-3B' WHERE property_type = 'APARTMENT' AND bedrooms = 3;
    `);
    await client.query(`
      UPDATE market_rent_data SET property_type = 'R-2B' WHERE property_type = 'APARTMENT' AND bedrooms = 2;
    `);
    await client.query(`
      UPDATE market_rent_data SET property_type = 'R-4B+' WHERE property_type = 'HOUSE' OR property_type = 'R-4B+';
    `);
    await client.query(`
      UPDATE market_rent_data SET property_type = 'R-VL' WHERE property_type = 'TOWNHOUSE';
    `);
    await client.query(`
      UPDATE market_rent_data SET property_type = 'R-SR' WHERE property_type = 'STUDIO';
    `);

    console.log('Property types fixed successfully!');

    // Verify the changes
    const result = await client.query('SELECT property_code, property_type FROM properties');
    console.log('\nUpdated properties:');
    result.rows.forEach(p => console.log(`  ${p.property_code}: ${p.property_type}`));

  } catch (error) {
    console.error('Fix failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixPropertyTypes().catch(console.error);
