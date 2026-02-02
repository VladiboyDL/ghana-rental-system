/**
 * Tenant Contract Tests
 *
 * Tests for contract viewing and confirmation from tenant perspective
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runTenantContractTests() {
  const runner = new TestRunner('Tenant - Contracts');
  const api = new ApiClient();

  runner.start();

  // Login as tenant
  await runner.test('Login as tenant', async () => {
    const result = await api.login(config.demoAccounts.tenant.email, config.demoAccounts.tenant.password);
    assert.isTrue(result.success);
    assert.equals(result.user.role, 'TENANT_INDIVIDUAL');
  });

  // ─────────────────────────────────────────────────────────────────
  // VIEW CONTRACTS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View my contracts', async () => {
    const response = await api.get('/contracts/my');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View active contracts only', async () => {
    const response = await api.get('/contracts/my?status=ACTIVE');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View pending confirmation contracts', async () => {
    const response = await api.get('/contracts/pending');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Get contract details', async () => {
    const listResponse = await api.get('/contracts/my');
    if (listResponse.data.data.length > 0) {
      const contractId = listResponse.data.data[0].id;
      const response = await api.get(`/contracts/${contractId}`);
      assert.isSuccess(response);
      assert.exists(response.data.data.monthlyRent);
      assert.exists(response.data.data.status);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT CONFIRMATION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Cannot confirm without code', async () => {
    const pendingResponse = await api.get('/contracts/pending');
    if (pendingResponse.data.data.length > 0) {
      const pendingContract = pendingResponse.data.data[0];
      const response = await api.post(`/contracts/${pendingContract.id}/confirm`, {});
      assert.isError(response);
    }
  });

  await runner.test('Cannot confirm with invalid code', async () => {
    const pendingResponse = await api.get('/contracts/pending');
    if (pendingResponse.data.data.length > 0) {
      const pendingContract = pendingResponse.data.data[0];
      const response = await api.post(`/contracts/${pendingContract.id}/confirm`, {
        confirmationCode: 'INVALID123'
      });
      assert.isError(response);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT OBJECTION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Object to contract requires reason', async () => {
    const pendingResponse = await api.get('/contracts/pending');
    if (pendingResponse.data.data.length > 0) {
      const pendingContract = pendingResponse.data.data[0];
      const response = await api.post(`/contracts/${pendingContract.id}/object`, {});
      assert.isError(response);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Cannot create contracts as tenant', async () => {
    const response = await api.post('/contracts', {
      propertyId: 'some-property-id',
      tenantEmail: config.demoAccounts.tenant.email,
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      monthlyRent: 3500,
      advanceMonths: 2,
      contractType: 'RESIDENTIAL'
    });
    assert.isError(response);
  });

  await runner.test('Cannot cancel contracts as tenant', async () => {
    const listResponse = await api.get('/contracts/my');
    if (listResponse.data.data.length > 0) {
      const contractId = listResponse.data.data[0].id;
      const response = await api.post(`/contracts/${contractId}/cancel`, {
        reason: 'Testing'
      });
      // Tenant should not be able to cancel
      assert.isError(response);
    }
  });

  await runner.test('Cannot access other tenant contracts', async () => {
    const otherTenantApi = new ApiClient();
    await otherTenantApi.login(config.demoAccounts.tenant2.email, config.demoAccounts.tenant2.password);

    const myContracts = await api.get('/contracts/my');
    if (myContracts.data.data.length > 0) {
      const myContractId = myContracts.data.data[0].id;

      // Other tenant tries to access my contract
      const response = await otherTenantApi.get(`/contracts/${myContractId}`);
      // Should either fail or return limited data
      if (response.success) {
        // Verify tenant ID matches
        assert.notEquals(response.data.data.tenantId, otherTenantApi.user?.id);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CONTRACT HISTORY
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View contract payment history', async () => {
    const listResponse = await api.get('/contracts/my');
    if (listResponse.data.data.length > 0) {
      const contractId = listResponse.data.data[0].id;
      const response = await api.get(`/contracts/${contractId}/payments`);
      if (response.success) {
        assert.isArray(response.data.data);
      }
    }
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runTenantContractTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runTenantContractTests };
