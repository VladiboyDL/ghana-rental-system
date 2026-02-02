/**
 * Database Indexes Migration
 * Adds performance indexes to frequently queried columns
 */

const { Pool } = require('pg');
require('dotenv').config();

async function addIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
  });

  console.log('Adding performance indexes...\n');

  const indexes = [
    // Users table indexes
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)',
    'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',

    // Properties table indexes
    'CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id)',
    'CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)',
    'CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city)',
    'CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district)',

    // Contracts table indexes
    'CREATE INDEX IF NOT EXISTS idx_contracts_landlord_id ON contracts(landlord_id)',
    'CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON contracts(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON contracts(property_id)',
    'CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)',
    'CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date)',
    'CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date)',

    // Payments table indexes
    'CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_landlord_id ON payments(landlord_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id)',
    'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
    'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)',

    // Tax withholdings table indexes
    'CREATE INDEX IF NOT EXISTS idx_tax_withholdings_landlord_id ON tax_withholdings(landlord_id)',
    'CREATE INDEX IF NOT EXISTS idx_tax_withholdings_payment_id ON tax_withholdings(payment_id)',
    'CREATE INDEX IF NOT EXISTS idx_tax_withholdings_tax_year ON tax_withholdings(tax_year)',
    'CREATE INDEX IF NOT EXISTS idx_tax_withholdings_status ON tax_withholdings(status)',

    // Notifications table indexes
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)',

    // Cases table indexes (for inspectors)
    'CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to)',
    'CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status)',
    'CREATE INDEX IF NOT EXISTS idx_cases_property_id ON cases(property_id)',
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const sql of indexes) {
    try {
      await pool.query(sql);
      const indexName = sql.match(/idx_\w+/)?.[0];
      console.log(`✓ Created: ${indexName}`);
      successCount++;
    } catch (err) {
      const indexName = sql.match(/idx_\w+/)?.[0];
      // Ignore "relation does not exist" errors for optional tables
      if (err.message.includes('does not exist')) {
        console.log(`⊘ Skipped: ${indexName} (table does not exist)`);
      } else {
        console.error(`✗ Error creating ${indexName}:`, err.message);
        errorCount++;
      }
    }
  }

  await pool.end();

  console.log(`\n✓ Done! Created ${successCount} indexes, ${errorCount} errors`);
}

// Run if executed directly
if (require.main === module) {
  addIndexes()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { addIndexes };
