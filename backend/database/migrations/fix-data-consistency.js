/**
 * Fix data consistency - update contracts and payments to have realistic dates
 * Run with: node database/migrations/fix-data-consistency.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixDataConsistency() {
  console.log('Fixing data consistency...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current date info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`Current date: ${currentYear}-${currentMonth}`);

    // Update contracts to have current/recent dates
    // Contract 1: Active contract starting 6 months ago, ending in 18 months
    const contract1Start = new Date(now);
    contract1Start.setMonth(contract1Start.getMonth() - 6);
    const contract1End = new Date(now);
    contract1End.setMonth(contract1End.getMonth() + 18);

    // Contract 2: Active contract starting 3 months ago, ending in 9 months
    const contract2Start = new Date(now);
    contract2Start.setMonth(contract2Start.getMonth() - 3);
    const contract2End = new Date(now);
    contract2End.setMonth(contract2End.getMonth() + 9);

    // Contract 3: Pending contract starting next month
    const contract3Start = new Date(now);
    contract3Start.setMonth(contract3Start.getMonth() + 1);
    const contract3End = new Date(now);
    contract3End.setMonth(contract3End.getMonth() + 13);

    // Update contract dates
    await client.query(`
      UPDATE contracts
      SET start_date = CASE contract_number
            WHEN 'CTR-2024-0001' THEN $1::date
            WHEN 'CTR-2024-0002' THEN $2::date
            WHEN 'CTR-2024-0003' THEN $3::date
            ELSE start_date
          END,
          end_date = CASE contract_number
            WHEN 'CTR-2024-0001' THEN $4::date
            WHEN 'CTR-2024-0002' THEN $5::date
            WHEN 'CTR-2024-0003' THEN $6::date
            ELSE end_date
          END,
          landlord_signed_at = CASE contract_number
            WHEN 'CTR-2024-0001' THEN ($1::date - INTERVAL '10 days')
            WHEN 'CTR-2024-0002' THEN ($2::date - INTERVAL '10 days')
            WHEN 'CTR-2024-0003' THEN ($3::date - INTERVAL '5 days')
            ELSE landlord_signed_at
          END,
          tenant_confirmed_at = CASE
            WHEN contract_number = 'CTR-2024-0001' THEN ($1::date - INTERVAL '9 days')
            WHEN contract_number = 'CTR-2024-0002' THEN ($2::date - INTERVAL '9 days')
            ELSE tenant_confirmed_at
          END,
          updated_at = NOW()
      WHERE contract_number IN ('CTR-2024-0001', 'CTR-2024-0002', 'CTR-2024-0003')
    `, [
      contract1Start.toISOString().split('T')[0],
      contract2Start.toISOString().split('T')[0],
      contract3Start.toISOString().split('T')[0],
      contract1End.toISOString().split('T')[0],
      contract2End.toISOString().split('T')[0],
      contract3End.toISOString().split('T')[0]
    ]);

    console.log('Contracts updated');

    // Get contract IDs
    const contractsResult = await client.query(`
      SELECT id, contract_number, landlord_id, tenant_id, monthly_rent, start_date
      FROM contracts
      ORDER BY contract_number
    `);

    const contracts = contractsResult.rows;
    console.log(`Found ${contracts.length} contracts`);

    // Delete old payments
    await client.query('DELETE FROM payments');
    console.log('Old payments deleted');

    // Generate realistic payment history for each active contract
    for (const contract of contracts) {
      if (contract.contract_number === 'CTR-2024-0003') {
        // Pending contract - no payments yet
        continue;
      }

      const startDate = new Date(contract.start_date);
      const grossAmount = parseFloat(contract.monthly_rent);
      const taxAmount = grossAmount * 0.08;
      const netAmount = grossAmount - taxAmount - (grossAmount * 0.01); // 1% platform fee
      const platformFee = grossAmount * 0.01;

      // Generate payments from contract start until now
      let paymentDate = new Date(startDate);
      let paymentNum = 1;

      while (paymentDate < now) {
        const periodStart = new Date(paymentDate);
        const periodEnd = new Date(paymentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(periodEnd.getDate() - 1);

        const completedAt = new Date(periodStart);
        completedAt.setDate(completedAt.getDate() + 3); // Payment completed 3 days into month

        const settledAt = new Date(completedAt);
        settledAt.setDate(settledAt.getDate() + 1); // Settlement next day

        const paymentRef = `PAY-${currentYear}-${String(paymentNum).padStart(4, '0')}-${contract.contract_number.split('-')[2]}`;

        await client.query(`
          INSERT INTO payments (
            payment_reference, contract_id, tenant_id, landlord_id,
            gross_amount, tax_amount, net_amount, platform_fee,
            period_start, period_end,
            payment_method, payment_provider,
            status, completed_at, settled_at, initiated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $14)
        `, [
          paymentRef,
          contract.id,
          contract.tenant_id,
          contract.landlord_id,
          grossAmount,
          taxAmount,
          netAmount,
          platformFee,
          periodStart.toISOString().split('T')[0],
          periodEnd.toISOString().split('T')[0],
          'MOBILE_MONEY',
          paymentNum % 2 === 0 ? 'MTN' : 'VODAFONE',
          'COMPLETED',
          completedAt.toISOString(),
          settledAt.toISOString()
        ]);

        paymentDate.setMonth(paymentDate.getMonth() + 1);
        paymentNum++;
      }

      console.log(`Generated ${paymentNum - 1} payments for contract ${contract.contract_number}`);
    }

    // Update tax certificates to current year
    await client.query(`
      UPDATE tax_certificates
      SET period_year = $1,
          period_month = $2
      WHERE period_year < $1
    `, [currentYear, currentMonth > 1 ? currentMonth - 1 : 12]);

    console.log('Tax certificates updated');

    // Update market rent data to current period
    await client.query(`
      UPDATE market_rent_data
      SET period_year = $1,
          period_month = $2,
          calculated_at = NOW()
    `, [currentYear, currentMonth]);

    console.log('Market rent data updated');

    await client.query('COMMIT');
    console.log('\n=== Data consistency fix completed! ===');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fix failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDataConsistency().catch(console.error);
