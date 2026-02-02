/**
 * Notification Tests
 *
 * Tests for notification system (WhatsApp, n8n, SMS)
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runNotificationTests() {
  const runner = new TestRunner('Shared - Notifications');
  const api = new ApiClient();

  runner.start();

  // Login as admin to access notification features
  await runner.test('Login as admin', async () => {
    const result = await api.login(config.demoAccounts.admin.email, config.demoAccounts.admin.password);
    assert.isTrue(result.success);
  });

  // ─────────────────────────────────────────────────────────────────
  // NOTIFICATION STATUS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get notification channel status', async () => {
    const response = await api.get('/notifications/status');
    assert.isSuccess(response);
    assert.exists(response.data.data.whatsapp);
    assert.exists(response.data.data.n8n);
    assert.exists(response.data.data.fallback);
  });

  await runner.test('Check WhatsApp configuration', async () => {
    const response = await api.get('/notifications/status');
    assert.isSuccess(response);
    const whatsapp = response.data.data.whatsapp;
    assert.exists(whatsapp.enabled);
    assert.exists(whatsapp.configured);
  });

  await runner.test('Check n8n configuration', async () => {
    const response = await api.get('/notifications/status');
    assert.isSuccess(response);
    const n8n = response.data.data.n8n;
    assert.exists(n8n.enabled);
    assert.exists(n8n.configured);
  });

  // ─────────────────────────────────────────────────────────────────
  // NOTIFICATION LOG
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get notification log', async () => {
    const response = await api.get('/notifications/log');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // N8N EVENT TYPES
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get available n8n event types', async () => {
    const response = await api.get('/notifications/n8n/events');
    assert.isSuccess(response);
    assert.exists(response.data.data);
    // Check for key event types
    const events = response.data.data;
    assert.exists(events.OTP_GENERATED);
    assert.exists(events.PAYMENT_COMPLETED);
    assert.exists(events.CONTRACT_CREATED);
  });

  // ─────────────────────────────────────────────────────────────────
  // TEST ENDPOINTS (Requires Auth)
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Test OTP endpoint returns data', async () => {
    const response = await api.post('/notifications/test/otp', {
      phoneNumber: '+233241234567',
      purpose: 'verification'
    });
    if (response.success) {
      assert.exists(response.data.data.testOTP);
      assert.exists(response.data.data.channel);
    }
  });

  await runner.test('Test n8n webhook', async () => {
    const response = await api.post('/notifications/test/n8n', {
      eventType: 'test.ping',
      payload: { test: true }
    });
    // May fail if n8n is not configured/enabled
    assert.exists(response.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Notification status is public', async () => {
    const unauthApi = new ApiClient();
    const response = await unauthApi.get('/notifications/status');
    // Status should be publicly accessible
    assert.isSuccess(response);
  });

  await runner.test('Test endpoints require auth', async () => {
    const unauthApi = new ApiClient();
    const response = await unauthApi.post('/notifications/test/otp', {
      phoneNumber: '+233241234567'
    });
    assert.statusCode(response, 401);
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runNotificationTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runNotificationTests };
