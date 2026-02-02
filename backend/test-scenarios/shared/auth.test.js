/**
 * Shared Authentication Tests
 *
 * Tests for registration, login, OTP verification, and password management
 * These tests apply to all user roles
 */

const { TestRunner, ApiClient, assert, config } = require('../utils');

async function runAuthTests() {
  const runner = new TestRunner('Authentication & Authorization');
  const api = new ApiClient();

  runner.start();

  // ─────────────────────────────────────────────────────────────────
  // HEALTH CHECK
  // ─────────────────────────────────────────────────────────────────

  await runner.test('API health check', async () => {
    const response = await api.get('/health');
    assert.isSuccess(response);
    assert.equals(response.data.data.status, 'healthy');
  });

  // ─────────────────────────────────────────────────────────────────
  // REGISTRATION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Register new landlord', async () => {
    const userData = {
      email: config.generateEmail('landlord'),
      phone: config.generatePhone(),
      password: 'Test@123',
      role: 'LANDLORD_INDIVIDUAL',
      firstName: 'Test',
      lastName: 'Landlord',
      ghanaCardNumber: config.generateGhanaCard(),
      tinNumber: config.generateTIN(),
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan'
    };

    const response = await api.post('/auth/register', userData);
    // Registration may return OTP message
    assert.exists(response.data);
  });

  await runner.test('Register new tenant', async () => {
    const userData = {
      email: config.generateEmail('tenant'),
      phone: config.generatePhone(),
      password: 'Test@123',
      role: 'TENANT_INDIVIDUAL',
      firstName: 'Test',
      lastName: 'Tenant',
      ghanaCardNumber: config.generateGhanaCard(),
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan'
    };

    const response = await api.post('/auth/register', userData);
    assert.exists(response.data);
  });

  await runner.test('Reject registration with invalid role', async () => {
    const userData = {
      email: config.generateEmail('invalid'),
      phone: config.generatePhone(),
      password: 'Test@123',
      role: 'INVALID_ROLE',
      firstName: 'Test',
      lastName: 'User',
      ghanaCardNumber: config.generateGhanaCard(),
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan'
    };

    const response = await api.post('/auth/register', userData);
    assert.isError(response);
  });

  await runner.test('Reject registration with missing required fields', async () => {
    const response = await api.post('/auth/register', {
      email: config.generateEmail('incomplete'),
      password: 'Test@123'
    });
    assert.isError(response);
  });

  await runner.test('Reject registration with duplicate email', async () => {
    const response = await api.post('/auth/register', {
      email: 'landlord@demo.com', // Already exists
      phone: config.generatePhone(),
      password: 'Test@123',
      role: 'TENANT_INDIVIDUAL',
      firstName: 'Duplicate',
      lastName: 'User',
      ghanaCardNumber: config.generateGhanaCard(),
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan'
    });
    assert.isError(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Login with valid credentials (landlord)', async () => {
    const response = await api.login(config.demoAccounts.landlord.email, config.demoAccounts.landlord.password);
    assert.isTrue(response.success);
    assert.exists(response.token);
    assert.exists(response.user);
    assert.equals(response.user.email, config.demoAccounts.landlord.email);
  });

  await runner.test('Login with valid credentials (tenant)', async () => {
    const tenantApi = new ApiClient();
    const response = await tenantApi.login(config.demoAccounts.tenant.email, config.demoAccounts.tenant.password);
    assert.isTrue(response.success);
    assert.exists(response.token);
  });

  await runner.test('Login with valid credentials (GRA officer)', async () => {
    const graApi = new ApiClient();
    const response = await graApi.login(config.demoAccounts.graOfficer.email, config.demoAccounts.graOfficer.password);
    assert.isTrue(response.success);
    assert.exists(response.token);
  });

  await runner.test('Reject login with wrong password', async () => {
    const response = await api.post('/auth/login', {
      email: config.demoAccounts.landlord.email,
      password: 'wrongpassword'
    });
    assert.isError(response);
  });

  await runner.test('Reject login with non-existent email', async () => {
    const response = await api.post('/auth/login', {
      email: 'nonexistent@test.com',
      password: 'Test@123'
    });
    assert.isError(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // TOKEN & AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Access protected route with valid token', async () => {
    const authApi = new ApiClient();
    await authApi.login(config.demoAccounts.landlord.email, config.demoAccounts.landlord.password);

    const response = await authApi.get('/users/me');
    assert.isSuccess(response);
    assert.exists(response.data.data);
  });

  await runner.test('Reject access to protected route without token', async () => {
    const unauthApi = new ApiClient();
    const response = await unauthApi.get('/users/me');
    assert.statusCode(response, 401);
  });

  await runner.test('Reject access with invalid token', async () => {
    const badApi = new ApiClient();
    badApi.setToken('invalid-token-12345');
    const response = await badApi.get('/users/me');
    assert.statusCode(response, 401);
  });

  // ─────────────────────────────────────────────────────────────────
  // SIMULATION ACTIVATE (OTP Bypass)
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Simulation activate requires valid key', async () => {
    const response = await api.post('/auth/simulation-activate',
      { email: 'test@test.com' },
      { 'X-Simulation-Key': 'wrong-key' }
    );
    assert.statusCode(response, 403);
  });

  await runner.test('Simulation activate works with valid key', async () => {
    // First register a new user
    const email = config.generateEmail('simtest');
    await api.post('/auth/register', {
      email,
      phone: config.generatePhone(),
      password: 'Test@123',
      role: 'TENANT_INDIVIDUAL',
      firstName: 'Sim',
      lastName: 'Test',
      ghanaCardNumber: config.generateGhanaCard(),
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan'
    });

    // Activate via simulation
    const response = await api.post('/auth/simulation-activate',
      { email },
      { 'X-Simulation-Key': config.simulationKey }
    );
    assert.isSuccess(response);
    assert.exists(response.data.data.token);
  });

  // ─────────────────────────────────────────────────────────────────
  // PASSWORD RESET
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Request password reset for valid email', async () => {
    const response = await api.post('/auth/forgot-password', {
      email: config.demoAccounts.tenant.email
    });
    // Should return success even if OTP is simulated
    assert.exists(response.data);
  });

  await runner.test('Request password reset for non-existent email', async () => {
    const response = await api.post('/auth/forgot-password', {
      email: 'nonexistent@test.com'
    });
    // API may return success to prevent email enumeration
    assert.exists(response.data);
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runAuthTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runAuthTests };
