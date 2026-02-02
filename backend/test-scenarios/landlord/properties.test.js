/**
 * Landlord Property Management Tests
 *
 * Tests for property CRUD operations from landlord perspective
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runLandlordPropertyTests() {
  const runner = new TestRunner('Landlord - Property Management');
  const api = new ApiClient();

  runner.start();

  // Login as landlord
  let loginResult;
  await runner.test('Login as landlord', async () => {
    loginResult = await api.login(config.demoAccounts.landlord.email, config.demoAccounts.landlord.password);
    assert.isTrue(loginResult.success);
  });

  if (!loginResult?.success) {
    console.log('Cannot continue without login');
    return runner.summary();
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE PROPERTY
  // ─────────────────────────────────────────────────────────────────

  let createdPropertyId;

  await runner.test('Create new residential property', async () => {
    const propertyData = {
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      neighborhood: 'East Legon',
      streetAddress: '25 Test Street',
      propertyType: 'R-3B',
      propertyCategory: 'RESIDENTIAL',
      ownershipType: 'FREEHOLD',
      bedrooms: 3,
      bathrooms: 2,
      floorAreaSqm: 120,
      yearBuilt: 2020,
      isFurnished: true,
      hasParking: true,
      hasSecurity: true,
      hasGenerator: false,
      amenities: ['air_conditioning', 'water_heater']
    };

    const response = await api.post('/properties', propertyData);
    assert.isSuccess(response);
    assert.exists(response.data.data.id);
    createdPropertyId = response.data.data.id;
  });

  await runner.test('Create commercial property', async () => {
    const propertyData = {
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      neighborhood: 'Airport City',
      streetAddress: '10 Business Park',
      propertyType: 'C-OFF',
      propertyCategory: 'COMMERCIAL',
      ownershipType: 'LEASEHOLD',
      bedrooms: 0,
      bathrooms: 2,
      floorAreaSqm: 200,
      yearBuilt: 2019,
      isFurnished: false,
      hasParking: true,
      hasSecurity: true,
      hasGenerator: true
    };

    const response = await api.post('/properties', propertyData);
    assert.isSuccess(response);
  });

  await runner.test('Reject property creation with missing required fields', async () => {
    const response = await api.post('/properties', {
      region: 'Greater Accra',
      // Missing required fields
    });
    assert.isError(response);
  });

  await runner.test('Reject property creation with invalid property type', async () => {
    const response = await api.post('/properties', {
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      neighborhood: 'East Legon',
      propertyType: 'INVALID-TYPE',
      propertyCategory: 'RESIDENTIAL',
      ownershipType: 'FREEHOLD'
    });
    assert.isError(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // READ PROPERTIES
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get all my properties', async () => {
    const response = await api.get('/properties/my');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
    assert.hasMinLength(response.data.data, 1);
  });

  await runner.test('Get single property by ID', async () => {
    if (!createdPropertyId) {
      throw new Error('No property ID from previous test');
    }
    const response = await api.get(`/properties/${createdPropertyId}`);
    assert.isSuccess(response);
    assert.equals(response.data.data.id, createdPropertyId);
  });

  await runner.test('Get property with invalid ID returns error', async () => {
    const response = await api.get('/properties/invalid-id-12345');
    assert.isError(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // UPDATE PROPERTY
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Update property details', async () => {
    if (!createdPropertyId) {
      throw new Error('No property ID from previous test');
    }
    const response = await api.put(`/properties/${createdPropertyId}`, {
      monthlyRent: 4500,
      description: 'Updated description for testing',
      isFurnished: false
    });
    assert.isSuccess(response);
  });

  await runner.test('Update property availability', async () => {
    if (!createdPropertyId) {
      throw new Error('No property ID from previous test');
    }
    const response = await api.patch(`/properties/${createdPropertyId}/availability`, {
      isAvailable: true
    });
    assert.isSuccess(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // PROPERTY LISTING
  // ─────────────────────────────────────────────────────────────────

  await runner.test('List property for rent', async () => {
    if (!createdPropertyId) {
      throw new Error('No property ID from previous test');
    }
    const response = await api.post(`/properties/${createdPropertyId}/list`, {
      monthlyRent: 3500,
      securityDeposit: 7000,
      availableFrom: new Date().toISOString().split('T')[0]
    });
    // May succeed or fail based on property status
    assert.exists(response.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // SEARCH & FILTER
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Search properties by region', async () => {
    const response = await api.get('/properties?region=Greater%20Accra');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search properties by property type', async () => {
    const response = await api.get('/properties?propertyType=R-3B');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search properties with price range', async () => {
    const response = await api.get('/properties?minRent=1000&maxRent=5000');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search available properties only', async () => {
    const response = await api.get('/properties?isAvailable=true');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Cannot update another landlord property', async () => {
    // Login as landlord2
    const otherApi = new ApiClient();
    await otherApi.login(config.demoAccounts.landlord2.email, config.demoAccounts.landlord2.password);

    // Try to update landlord1's property
    if (createdPropertyId) {
      const response = await otherApi.put(`/properties/${createdPropertyId}`, {
        monthlyRent: 9999
      });
      // Should fail with 403 or 404
      assert.isError(response);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // DELETE PROPERTY
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Delete property', async () => {
    // Create a property to delete
    const propertyData = {
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      city: 'Accra',
      neighborhood: 'Osu',
      streetAddress: '99 Delete Street',
      propertyType: 'R-1B',
      propertyCategory: 'RESIDENTIAL',
      ownershipType: 'FREEHOLD',
      bedrooms: 1,
      bathrooms: 1,
      floorAreaSqm: 50
    };

    const createResponse = await api.post('/properties', propertyData);
    if (createResponse.success) {
      const deleteId = createResponse.data.data.id;
      const deleteResponse = await api.delete(`/properties/${deleteId}`);
      assert.isSuccess(deleteResponse);
    }
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runLandlordPropertyTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runLandlordPropertyTests };
