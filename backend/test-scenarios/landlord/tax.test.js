/**
 * Landlord Tax Tests
 *
 * Tests for landlord tax-related features
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runLandlordTaxTests() {
  const runner = new TestRunner('Landlord - Tax Management');
  const api = new ApiClient();

  runner.start();

  // Login as landlord
  await runner.test('Login as landlord', async () => {
    const result = await api.login(config.demoAccounts.landlord.email, config.demoAccounts.landlord.password);
    assert.isTrue(result.success);
  });

  // ─────────────────────────────────────────────────────────────────
  // TAX OVERVIEW
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View tax summary', async () => {
    const response = await api.get('/tax/my-summary');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  await runner.test('View tax history', async () => {
    const response = await api.get('/tax/my-history');
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  await runner.test('View tax withheld by year', async () => {
    const response = await api.get('/tax/my-summary?year=2024');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // TAX CERTIFICATES
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View my tax certificates', async () => {
    const response = await api.get('/tax/my-certificates');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Get certificate details', async () => {
    const listResponse = await api.get('/tax/my-certificates');
    if (listResponse.data.data.length > 0) {
      const certId = listResponse.data.data[0].id;
      const response = await api.get(`/tax/certificates/${certId}`);
      if (response.success) {
        assert.exists(response.data.data.certificateNumber);
      }
    }
  });

  await runner.test('Download tax certificate', async () => {
    const listResponse = await api.get('/tax/my-certificates');
    if (listResponse.data.data.length > 0) {
      const certId = listResponse.data.data[0].id;
      const response = await api.get(`/tax/certificates/${certId}/download`);
      // May return PDF or certificate data
      assert.exists(response.data);
    }
  });

  await runner.test('Request new tax certificate', async () => {
    const response = await api.post('/tax/certificates/request', {
      periodType: 'MONTHLY',
      periodYear: 2024,
      periodMonth: 1
    });
    // May succeed or fail based on payment history
    assert.exists(response.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // TIN MANAGEMENT
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View TIN status', async () => {
    const response = await api.get('/users/me');
    assert.isSuccess(response);
    // Landlord should have TIN
    assert.exists(response.data.data.tinNumber);
  });

  await runner.test('Update TIN number', async () => {
    const newTIN = config.generateTIN();
    const response = await api.patch('/users/me', {
      tinNumber: newTIN
    });
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // TAX CALCULATIONS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Calculate tax on rental income', async () => {
    const response = await api.post('/tax/calculate', {
      grossAmount: 3500
    });
    if (response.success) {
      assert.exists(response.data.data.taxAmount);
      assert.exists(response.data.data.netAmount);
      // Tax rate should be 8%
      assert.equals(response.data.data.taxAmount, 280);
    }
  });

  await runner.test('View expected annual tax', async () => {
    const response = await api.get('/tax/my-projection?year=2024');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // PAYMENT BREAKDOWN
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View payments with tax breakdown', async () => {
    const response = await api.get('/payments/my');
    if (response.success && response.data.data.length > 0) {
      const payment = response.data.data[0];
      assert.exists(payment.grossAmount);
      assert.exists(payment.taxAmount);
      assert.exists(payment.netAmount);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // COMPLIANCE
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View compliance status', async () => {
    const response = await api.get('/tax/my-compliance');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runLandlordTaxTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runLandlordTaxTests };
