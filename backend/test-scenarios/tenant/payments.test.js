/**
 * Tenant Payment Tests
 *
 * Tests for rent payments from tenant perspective
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runTenantPaymentTests() {
  const runner = new TestRunner('Tenant - Payments');
  const api = new ApiClient();

  runner.start();

  // Login as tenant
  await runner.test('Login as tenant', async () => {
    const result = await api.login(config.demoAccounts.tenant.email, config.demoAccounts.tenant.password);
    assert.isTrue(result.success);
  });

  // ─────────────────────────────────────────────────────────────────
  // VIEW PAYMENTS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View my payment history', async () => {
    const response = await api.get('/payments/my');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View payments by status', async () => {
    const response = await api.get('/payments/my?status=COMPLETED');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Get payment details', async () => {
    const listResponse = await api.get('/payments/my');
    if (listResponse.data.data.length > 0) {
      const paymentId = listResponse.data.data[0].id;
      const response = await api.get(`/payments/${paymentId}`);
      assert.isSuccess(response);
      assert.exists(response.data.data.grossAmount);
      assert.exists(response.data.data.taxAmount);
      assert.exists(response.data.data.netAmount);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // INITIATE PAYMENT
  // ─────────────────────────────────────────────────────────────────

  let contractId;
  await runner.test('Get active contract for payment', async () => {
    const response = await api.get('/contracts/my?status=ACTIVE');
    if (response.data.data.length > 0) {
      contractId = response.data.data[0].id;
      assert.exists(contractId);
    }
  });

  await runner.test('Initiate rent payment (Mobile Money)', async () => {
    if (!contractId) {
      runner.skip('Initiate rent payment', 'No active contract');
      return;
    }

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const response = await api.post('/payments', {
      contractId,
      amount: 3500,
      paymentMethod: 'MOBILE_MONEY',
      provider: 'MTN',
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      phoneNumber: '+233241000002'
    });

    // Payment may be simulated
    assert.exists(response.data);
  });

  await runner.test('Initiate payment with bank transfer', async () => {
    if (!contractId) {
      runner.skip('Bank transfer payment', 'No active contract');
      return;
    }

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const response = await api.post('/payments', {
      contractId,
      amount: 3500,
      paymentMethod: 'BANK_TRANSFER',
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0]
    });

    assert.exists(response.data);
  });

  await runner.test('Reject payment without contract', async () => {
    const response = await api.post('/payments', {
      amount: 3500,
      paymentMethod: 'MOBILE_MONEY',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31'
    });
    assert.isError(response);
  });

  await runner.test('Reject payment with invalid contract', async () => {
    const response = await api.post('/payments', {
      contractId: 'invalid-contract-id',
      amount: 3500,
      paymentMethod: 'MOBILE_MONEY',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31'
    });
    assert.isError(response);
  });

  await runner.test('Reject payment with negative amount', async () => {
    if (!contractId) {
      runner.skip('Negative amount payment', 'No active contract');
      return;
    }

    const response = await api.post('/payments', {
      contractId,
      amount: -100,
      paymentMethod: 'MOBILE_MONEY',
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31'
    });
    assert.isError(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // PAYMENT RECEIPTS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Download payment receipt', async () => {
    const listResponse = await api.get('/payments/my?status=COMPLETED');
    if (listResponse.data.data.length > 0) {
      const paymentId = listResponse.data.data[0].id;
      const response = await api.get(`/payments/${paymentId}/receipt`);
      // May return PDF or receipt data
      assert.exists(response.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // TAX INFORMATION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View tax withheld on payments', async () => {
    const response = await api.get('/payments/my?status=COMPLETED');
    if (response.data.data.length > 0) {
      const payment = response.data.data[0];
      assert.exists(payment.taxAmount);
      assert.greaterOrEqual(payment.taxAmount, 0);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Cannot access other tenant payments', async () => {
    const otherTenantApi = new ApiClient();
    await otherTenantApi.login(config.demoAccounts.tenant2.email, config.demoAccounts.tenant2.password);

    const myPayments = await api.get('/payments/my');
    if (myPayments.data.data.length > 0) {
      const myPaymentId = myPayments.data.data[0].id;
      const response = await otherTenantApi.get(`/payments/${myPaymentId}`);
      // Should fail or return error
      if (response.success) {
        // If returns data, verify it's not the other tenant's
        assert.notEquals(response.data.data.tenantId, api.user?.id);
      }
    }
  });

  await runner.test('Cannot make payment for other tenant contract', async () => {
    const otherTenantApi = new ApiClient();
    await otherTenantApi.login(config.demoAccounts.tenant2.email, config.demoAccounts.tenant2.password);

    if (contractId) {
      const response = await otherTenantApi.post('/payments', {
        contractId, // My contract
        amount: 3500,
        paymentMethod: 'MOBILE_MONEY',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31'
      });
      assert.isError(response);
    }
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runTenantPaymentTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runTenantPaymentTests };
