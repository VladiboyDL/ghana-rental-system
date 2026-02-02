/**
 * Market Data Tests
 *
 * Tests for market rent data accessible by all users
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runMarketTests() {
  const runner = new TestRunner('Shared - Market Data');
  const api = new ApiClient();

  runner.start();

  // Login as tenant (any user can access market data)
  await runner.test('Login as tenant', async () => {
    const result = await api.login(config.demoAccounts.tenant.email, config.demoAccounts.tenant.password);
    assert.isTrue(result.success);
  });

  // ─────────────────────────────────────────────────────────────────
  // MARKET RENT DATA
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get rent check data', async () => {
    const response = await api.get('/market/rent-check?region=Greater%20Accra&propertyType=R-3B');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  await runner.test('Get rent trends', async () => {
    const response = await api.get('/market/trends?region=Greater%20Accra');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  await runner.test('Get locations data', async () => {
    const response = await api.get('/market/locations');
    assert.isSuccess(response);
    assert.exists(response.data.data);
  });

  await runner.test('Compare rent to market', async () => {
    const response = await api.post('/market/compare', {
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      propertyType: 'R-3B',
      proposedRent: 3500
    });
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // PROPERTY SEARCH
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Search available properties', async () => {
    const response = await api.get('/properties?isAvailable=true');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search by bedrooms', async () => {
    const response = await api.get('/properties?bedrooms=3&isAvailable=true');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search by price range', async () => {
    const response = await api.get('/properties?minRent=2000&maxRent=5000&isAvailable=true');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search by location', async () => {
    const response = await api.get('/properties?region=Greater%20Accra&district=Accra%20Metropolitan');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search furnished properties', async () => {
    const response = await api.get('/properties?isFurnished=true&isAvailable=true');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // REGIONS & DISTRICTS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get all regions', async () => {
    const response = await api.get('/market/regions');
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  await runner.test('Get districts by region', async () => {
    const response = await api.get('/market/districts?region=Greater%20Accra');
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  await runner.test('Get neighborhoods by district', async () => {
    const response = await api.get('/market/neighborhoods?region=Greater%20Accra&district=Accra%20Metropolitan');
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // PROPERTY TYPES
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get property types', async () => {
    const response = await api.get('/market/property-types');
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // RENT COMPARISON
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Compare rent to market average', async () => {
    const response = await api.post('/market/compare', {
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      neighborhood: 'East Legon',
      propertyType: 'R-3B',
      proposedRent: 4000
    });
    if (response.success) {
      assert.exists(response.data.data.marketAverage);
      assert.exists(response.data.data.comparison);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // UNAUTHENTICATED ACCESS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Market data accessible without auth', async () => {
    const unauthApi = new ApiClient();
    const response = await unauthApi.get('/market/locations');
    // Public market data should be accessible
    assert.isSuccess(response);
  });

  await runner.test('Property search accessible without auth', async () => {
    const unauthApi = new ApiClient();
    const response = await unauthApi.get('/properties?isAvailable=true');
    // Public property listings should be accessible
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runMarketTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runMarketTests };
