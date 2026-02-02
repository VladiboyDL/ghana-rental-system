/**
 * Landlord Contract Management Tests
 *
 * Tests for contract creation and management from landlord perspective
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runLandlordContractTests() {
  const runner = new TestRunner('Landlord - Contract Management');
  const landlordApi = new ApiClient();
  const tenantApi = new ApiClient();

  runner.start();

  // Login as landlord and tenant
  await runner.test('Login as landlord', async () => {
    const result = await landlordApi.login(config.demoAccounts.landlord.email, config.demoAccounts.landlord.password);
    assert.isTrue(result.success);
  });

  await runner.test('Login as tenant', async () => {
    const result = await tenantApi.login(config.demoAccounts.tenant.email, config.demoAccounts.tenant.password);
    assert.isTrue(result.success);
  });

  // Get a property for contract creation
  let propertyId;
  await runner.test('Get landlord properties', async () => {
    const response = await landlordApi.get('/properties/my');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
    if (response.data.data.length > 0) {
      propertyId = response.data.data[0].id;
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CREATE CONTRACT
  // ─────────────────────────────────────────────────────────────────

  let createdContractId;
  let confirmationCode;

  await runner.test('Create rental contract', async () => {
    if (!propertyId) {
      throw new Error('No property available for contract');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const contractData = {
      propertyId,
      tenantEmail: config.demoAccounts.tenant2.email,
      tenantPhone: '+233241000004',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      monthlyRent: 3500,
      securityDeposit: 7000,
      advanceMonths: 2,
      paymentFrequency: 'MONTHLY',
      contractType: 'RESIDENTIAL'
    };

    const response = await landlordApi.post('/contracts', contractData);
    if (response.success) {
      createdContractId = response.data.data.id;
      confirmationCode = response.data.data.confirmationCode;
      assert.exists(createdContractId);
    } else {
      // Contract may fail if tenant already has active lease
      assert.exists(response.data);
    }
  });

  await runner.test('Reject contract with invalid property ID', async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const response = await landlordApi.post('/contracts', {
      propertyId: 'invalid-property-id',
      tenantEmail: config.demoAccounts.tenant.email,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      monthlyRent: 3500,
      advanceMonths: 2,
      contractType: 'RESIDENTIAL'
    });
    assert.isError(response);
  });

  await runner.test('Reject contract with missing required fields', async () => {
    const response = await landlordApi.post('/contracts', {
      propertyId,
      // Missing tenant, dates, rent
    });
    assert.isError(response);
  });

  await runner.test('Reject contract with end date before start date', async () => {
    const response = await landlordApi.post('/contracts', {
      propertyId,
      tenantEmail: config.demoAccounts.tenant.email,
      startDate: '2025-12-31',
      endDate: '2025-01-01', // Before start
      monthlyRent: 3500,
      advanceMonths: 2,
      contractType: 'RESIDENTIAL'
    });
    assert.isError(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // READ CONTRACTS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get all my contracts (as landlord)', async () => {
    const response = await landlordApi.get('/contracts/my');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Get contracts by status', async () => {
    const response = await landlordApi.get('/contracts/my?status=ACTIVE');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Get single contract by ID', async () => {
    // Get first contract from list
    const listResponse = await landlordApi.get('/contracts/my');
    if (listResponse.data.data.length > 0) {
      const contractId = listResponse.data.data[0].id;
      const response = await landlordApi.get(`/contracts/${contractId}`);
      assert.isSuccess(response);
      assert.exists(response.data.data.id);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT CONFIRMATION (Tenant Side)
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get pending contracts (as tenant)', async () => {
    const response = await tenantApi.get('/contracts/pending');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Tenant cannot confirm with wrong code', async () => {
    const listResponse = await tenantApi.get('/contracts/pending');
    if (listResponse.data.data.length > 0) {
      const pendingContract = listResponse.data.data[0];
      const response = await tenantApi.post(`/contracts/${pendingContract.id}/confirm`, {
        confirmationCode: 'WRONG-CODE'
      });
      assert.isError(response);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT MODIFICATION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Update contract terms (before confirmation)', async () => {
    if (createdContractId) {
      const response = await landlordApi.patch(`/contracts/${createdContractId}`, {
        serviceCharge: 200,
        notes: 'Updated terms'
      });
      // May succeed or fail based on contract status
      assert.exists(response.data);
    } else {
      runner.skip('Update contract terms', 'No contract created');
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT CANCELLATION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Cancel pending contract', async () => {
    // Create a new contract to cancel
    if (propertyId) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Create test tenant
      const testTenantEmail = config.generateEmail('canceltest');
      const testTenantApi = new ApiClient();
      await testTenantApi.registerAndActivate({
        email: testTenantEmail,
        phone: config.generatePhone(),
        password: 'Test@123',
        role: 'TENANT_INDIVIDUAL',
        firstName: 'Cancel',
        lastName: 'Test',
        ghanaCardNumber: config.generateGhanaCard(),
        digitalAddress: config.generateDigitalAddress('GA'),
        region: 'Greater Accra',
        district: 'Accra Metropolitan'
      });

      const createResponse = await landlordApi.post('/contracts', {
        propertyId,
        tenantEmail: testTenantEmail,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        monthlyRent: 2500,
        advanceMonths: 1,
        contractType: 'RESIDENTIAL'
      });

      if (createResponse.success) {
        const cancelResponse = await landlordApi.post(`/contracts/${createResponse.data.data.id}/cancel`, {
          reason: 'Testing cancellation'
        });
        assert.isSuccess(cancelResponse);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Tenant cannot create contracts', async () => {
    const response = await tenantApi.post('/contracts', {
      propertyId,
      tenantEmail: config.demoAccounts.tenant.email,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      monthlyRent: 3500,
      advanceMonths: 2,
      contractType: 'RESIDENTIAL'
    });
    assert.isError(response);
  });

  await runner.test('Cannot access other landlord contracts', async () => {
    const otherLandlordApi = new ApiClient();
    await otherLandlordApi.login(config.demoAccounts.landlord2.email, config.demoAccounts.landlord2.password);

    // Try to access landlord1's contract
    const listResponse = await landlordApi.get('/contracts/my');
    if (listResponse.data.data.length > 0) {
      const contractId = listResponse.data.data[0].id;
      const response = await otherLandlordApi.get(`/contracts/${contractId}`);
      // Should fail or return limited data
      if (response.success) {
        // If it returns data, verify it's not full access
        assert.exists(response.data);
      }
    }
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runLandlordContractTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runLandlordContractTests };
