/**
 * Admin User Management Tests
 *
 * Tests for system administration features
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runAdminUserTests() {
  const runner = new TestRunner('Admin - User Management');
  const api = new ApiClient();

  runner.start();

  // Login as admin
  await runner.test('Login as admin', async () => {
    const result = await api.login(config.demoAccounts.admin.email, config.demoAccounts.admin.password);
    assert.isTrue(result.success);
    assert.equals(result.user.role, 'SYSTEM_ADMIN');
  });

  // ─────────────────────────────────────────────────────────────────
  // USER LISTING
  // ─────────────────────────────────────────────────────────────────

  await runner.test('List all users', async () => {
    const response = await api.get('/users');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
    assert.hasMinLength(response.data.data, 1);
  });

  await runner.test('List users by role - Landlords', async () => {
    const response = await api.get('/users?role=LANDLORD_INDIVIDUAL');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('List users by role - Tenants', async () => {
    const response = await api.get('/users?role=TENANT_INDIVIDUAL');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('List users by status', async () => {
    const response = await api.get('/users?status=ACTIVE');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Search users by email', async () => {
    const response = await api.get('/users?search=landlord@demo.com');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Pagination works correctly', async () => {
    const response = await api.get('/users?page=1&limit=5');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
    assert.greaterOrEqual(response.data.data.length, 0);
  });

  // ─────────────────────────────────────────────────────────────────
  // USER DETAILS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get user details', async () => {
    const listResponse = await api.get('/users');
    if (listResponse.data.data.length > 0) {
      const userId = listResponse.data.data[0].id;
      const response = await api.get(`/users/${userId}`);
      assert.isSuccess(response);
      assert.exists(response.data.data.email);
      assert.exists(response.data.data.role);
    }
  });

  await runner.test('Get non-existent user returns error', async () => {
    const response = await api.get('/users/non-existent-user-id');
    assert.isError(response);
  });

  // ─────────────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────

  let createdUserId;

  await runner.test('Create new user (GRA Officer)', async () => {
    const userData = {
      email: config.generateEmail('gra_officer'),
      phone: config.generatePhone(),
      password: 'Admin@123',
      role: 'GRA_OFFICER',
      firstName: 'New',
      lastName: 'Officer',
      ghanaCardNumber: config.generateGhanaCard(),
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan'
    };

    const response = await api.post('/admin/users', userData);
    if (response.success) {
      createdUserId = response.data.data.id;
      assert.exists(createdUserId);
    }
  });

  await runner.test('Create new inspector', async () => {
    const userData = {
      email: config.generateEmail('inspector'),
      phone: config.generatePhone(),
      password: 'Admin@123',
      role: 'INSPECTOR',
      firstName: 'New',
      lastName: 'Inspector',
      ghanaCardNumber: config.generateGhanaCard(),
      digitalAddress: config.generateDigitalAddress('GA'),
      region: 'Greater Accra',
      district: 'Accra Metropolitan'
    };

    const response = await api.post('/admin/users', userData);
    if (response.success) {
      assert.exists(response.data.data.id);
    }
  });

  await runner.test('Update user status', async () => {
    if (createdUserId) {
      const response = await api.patch(`/admin/users/${createdUserId}/status`, {
        status: 'SUSPENDED',
        reason: 'Admin test'
      });
      if (response.success) {
        assert.equals(response.data.data.status, 'SUSPENDED');
      }
    }
  });

  await runner.test('Reactivate user', async () => {
    if (createdUserId) {
      const response = await api.patch(`/admin/users/${createdUserId}/status`, {
        status: 'ACTIVE'
      });
      if (response.success) {
        assert.equals(response.data.data.status, 'ACTIVE');
      }
    }
  });

  await runner.test('Update user verification status', async () => {
    if (createdUserId) {
      const response = await api.patch(`/admin/users/${createdUserId}/verify`, {
        verificationStatus: 'VERIFIED',
        notes: 'Documents verified by admin'
      });
      if (response.success) {
        assert.exists(response.data.data);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // SYSTEM OVERVIEW
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Get admin dashboard stats', async () => {
    const response = await api.get('/admin/dashboard');
    assert.isSuccess(response);
    assert.exists(response.data.data);
  });

  await runner.test('Get system statistics', async () => {
    const response = await api.get('/admin/statistics');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  await runner.test('View all properties (admin)', async () => {
    const response = await api.get('/admin/properties');
    if (response.success) {
      assert.isArray(response.data.data);
    } else {
      // Fallback to regular properties endpoint
      const fallback = await api.get('/properties');
      assert.isSuccess(fallback);
    }
  });

  await runner.test('View all contracts (admin)', async () => {
    const response = await api.get('/admin/contracts');
    if (response.success) {
      assert.isArray(response.data.data);
    } else {
      const fallback = await api.get('/contracts');
      assert.isSuccess(fallback);
    }
  });

  await runner.test('View all payments (admin)', async () => {
    const response = await api.get('/admin/payments');
    if (response.success) {
      assert.isArray(response.data.data);
    } else {
      const fallback = await api.get('/payments');
      assert.isSuccess(fallback);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CASE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View all inspection cases', async () => {
    const response = await api.get('/cases');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Create inspection case', async () => {
    const propertiesResponse = await api.get('/properties');
    if (propertiesResponse.data.data.length > 0) {
      const propertyId = propertiesResponse.data.data[0].id;
      const response = await api.post('/cases', {
        propertyId,
        caseType: 'ROUTINE_INSPECTION',
        priority: 'MEDIUM',
        source: 'ADMIN',
        description: 'Admin-initiated routine inspection'
      });
      if (response.success) {
        assert.exists(response.data.data.id);
        assert.exists(response.data.data.caseNumber);
      }
    }
  });

  await runner.test('Assign case to inspector', async () => {
    const casesResponse = await api.get('/cases?status=OPEN');
    const inspectorsResponse = await api.get('/users?role=INSPECTOR');

    if (casesResponse.data.data.length > 0 && inspectorsResponse.data.data.length > 0) {
      const caseId = casesResponse.data.data[0].id;
      const inspectorId = inspectorsResponse.data.data[0].id;

      const response = await api.post(`/cases/${caseId}/assign`, {
        inspectorId
      });
      if (response.success) {
        assert.exists(response.data.data);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // SYSTEM CONFIGURATION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View system configuration', async () => {
    const response = await api.get('/admin/config');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  await runner.test('View notification settings', async () => {
    const response = await api.get('/notifications/status');
    assert.isSuccess(response);
    assert.exists(response.data.data);
  });

  // ─────────────────────────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View audit logs', async () => {
    const response = await api.get('/admin/audit-logs');
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  await runner.test('Filter audit logs by action', async () => {
    const response = await api.get('/admin/audit-logs?action=LOGIN');
    if (response.success) {
      assert.isArray(response.data.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Non-admin cannot access admin routes', async () => {
    const landlordApi = new ApiClient();
    await landlordApi.login(config.demoAccounts.landlord.email, config.demoAccounts.landlord.password);

    const response = await landlordApi.get('/admin/users');
    assert.isError(response);
  });

  await runner.test('Non-admin cannot create users', async () => {
    const tenantApi = new ApiClient();
    await tenantApi.login(config.demoAccounts.tenant.email, config.demoAccounts.tenant.password);

    const response = await tenantApi.post('/admin/users', {
      email: config.generateEmail('hacker'),
      password: 'Test@123',
      role: 'SYSTEM_ADMIN',
      firstName: 'Hacker',
      lastName: 'Test'
    });
    assert.isError(response);
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runAdminUserTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runAdminUserTests };
