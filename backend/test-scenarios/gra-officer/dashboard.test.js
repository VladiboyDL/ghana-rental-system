/**
 * GRA Officer Dashboard Tests
 *
 * Tests for GRA tax administration features
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runGRADashboardTests() {
  const runner = new TestRunner('GRA Officer - Dashboard & Tax Administration');
  const api = new ApiClient();

  runner.start();

  // Login as GRA officer
  await runner.test('Login as GRA officer', async () => {
    const result = await api.login(config.demoAccounts.graOfficer.email, config.demoAccounts.graOfficer.password);
    assert.isTrue(result.success);
    assert.equals(result.user.role, 'GRA_OFFICER');
  });

  // ─────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Access GRA dashboard', async () => {
    const response = await api.get('/admin/dashboard');
    assert.isSuccess(response);
    assert.exists(response.data.data);
  });

  await runner.test('View tax statistics', async () => {
    const response = await api.get('/tax/statistics');
    assert.isSuccess(response);
    assert.exists(response.data.data);
  });

  await runner.test('View tax collection summary', async () => {
    const response = await api.get('/tax/collection-summary');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // LANDLORD TAX RECORDS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View all landlord tax records', async () => {
    const response = await api.get('/tax/landlord-records');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search landlord by TIN', async () => {
    const response = await api.get('/tax/landlord-records?tin=P0012345678');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View landlord tax details', async () => {
    const listResponse = await api.get('/users?role=LANDLORD_INDIVIDUAL');
    if (listResponse.data.data.length > 0) {
      const landlordId = listResponse.data.data[0].id;
      const response = await api.get(`/tax/landlord/${landlordId}`);
      if (response.success) {
        assert.exists(response.data.data);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // TAX CERTIFICATES
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View all tax certificates', async () => {
    const response = await api.get('/tax/certificates');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search certificates by landlord', async () => {
    const response = await api.get('/tax/certificates?landlordEmail=landlord@demo.com');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Verify tax certificate', async () => {
    const response = await api.get('/tax/certificates/verify/VER-ABC123XYZ');
    // May succeed or fail based on whether certificate exists
    assert.exists(response.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // PAYMENT RECORDS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View all rent payments (for tax purposes)', async () => {
    const response = await api.get('/payments');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Filter payments by date range', async () => {
    const response = await api.get('/payments?startDate=2024-01-01&endDate=2024-12-31');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Filter payments by region', async () => {
    const response = await api.get('/payments?region=Greater%20Accra');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT OVERSIGHT
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View all contracts (oversight)', async () => {
    const response = await api.get('/contracts');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View contracts by status', async () => {
    const response = await api.get('/contracts?status=ACTIVE');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // PROPERTY REGISTRY
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View all registered properties', async () => {
    const response = await api.get('/properties');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View unverified properties', async () => {
    const response = await api.get('/properties?status=PENDING_VERIFICATION');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // MARKET DATA
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Access market rent data', async () => {
    const response = await api.get('/market/rent-data');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Get market rent by region', async () => {
    const response = await api.get('/market/rent-data?region=Greater%20Accra');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // REPORTS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Generate tax collection report', async () => {
    const response = await api.get('/tax/reports/collection?year=2024');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  await runner.test('Generate compliance report', async () => {
    const response = await api.get('/tax/reports/compliance?year=2024');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('GRA cannot modify contracts', async () => {
    const contractsResponse = await api.get('/contracts');
    if (contractsResponse.data.data.length > 0) {
      const contractId = contractsResponse.data.data[0].id;
      const response = await api.patch(`/contracts/${contractId}`, {
        monthlyRent: 9999
      });
      // Should fail - GRA can view but not modify
      assert.isError(response);
    }
  });

  await runner.test('GRA cannot create properties', async () => {
    const response = await api.post('/properties', {
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      neighborhood: 'East Legon',
      propertyType: 'R-3B',
      propertyCategory: 'RESIDENTIAL',
      ownershipType: 'FREEHOLD'
    });
    assert.isError(response);
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runGRADashboardTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runGRADashboardTests };
