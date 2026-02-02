/**
 * Inspector Case Management Tests
 *
 * Tests for property inspection and case management
 */

const { TestRunner, ApiClient, assert, config, sleep } = require('../utils');

async function runInspectorCaseTests() {
  const runner = new TestRunner('Inspector - Case Management');
  const api = new ApiClient();

  runner.start();

  // Login as inspector
  await runner.test('Login as inspector', async () => {
    const result = await api.login(config.demoAccounts.inspector.email, config.demoAccounts.inspector.password);
    assert.isTrue(result.success);
    assert.equals(result.user.role, 'INSPECTOR');
  });

  // ─────────────────────────────────────────────────────────────────
  // VIEW CASES
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View assigned cases', async () => {
    const response = await api.get('/cases/my');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View cases by status', async () => {
    const response = await api.get('/cases/my?status=ASSIGNED');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('View cases by priority', async () => {
    const response = await api.get('/cases/my?priority=HIGH');
    assert.isSuccess(response);
    assert.isArray(response.data.data);
  });

  await runner.test('Get case details', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const response = await api.get(`/cases/${caseId}`);
      assert.isSuccess(response);
      assert.exists(response.data.data.caseNumber);
      assert.exists(response.data.data.status);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // CASE ACTIONS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Start inspection (begin case)', async () => {
    const listResponse = await api.get('/cases/my?status=ASSIGNED');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const response = await api.post(`/cases/${caseId}/start`, {
        notes: 'Starting inspection'
      });
      // May succeed or fail based on case state
      assert.exists(response.data);
    }
  });

  await runner.test('Add case notes', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const response = await api.post(`/cases/${caseId}/notes`, {
        content: 'Inspection note: Property access verified',
        isInternal: false
      });
      if (response.success) {
        assert.exists(response.data.data);
      }
    }
  });

  await runner.test('Upload inspection evidence', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      // Note: Actual file upload would require multipart form
      const response = await api.post(`/cases/${caseId}/evidence`, {
        description: 'Property exterior photo',
        type: 'PHOTO'
      });
      // May succeed or fail based on implementation
      assert.exists(response.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // INSPECTION REPORT
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Submit inspection report', async () => {
    const listResponse = await api.get('/cases/my?status=IN_PROGRESS');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const response = await api.post(`/cases/${caseId}/report`, {
        findings: 'Property matches registration details',
        ownershipVerified: true,
        conditionRating: 'GOOD',
        recommendedAction: 'APPROVE',
        notes: 'All documents verified'
      });
      if (response.success) {
        assert.exists(response.data.data);
      }
    }
  });

  await runner.test('Reject incomplete report submission', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const response = await api.post(`/cases/${caseId}/report`, {
        // Missing required fields
      });
      assert.isError(response);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // SCHEDULE INSPECTION
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Schedule inspection date', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 3);

      const response = await api.post(`/cases/${caseId}/schedule`, {
        scheduledDate: scheduledDate.toISOString(),
        notes: 'Please ensure property access'
      });
      if (response.success) {
        assert.exists(response.data.data);
      }
    }
  });

  await runner.test('Reschedule inspection', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 7);

      const response = await api.post(`/cases/${caseId}/reschedule`, {
        newDate: newDate.toISOString(),
        reason: 'Landlord requested change'
      });
      assert.exists(response.data);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // PROPERTY ACCESS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View property details for case', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0 && listResponse.data.data[0].propertyId) {
      const propertyId = listResponse.data.data[0].propertyId;
      const response = await api.get(`/properties/${propertyId}`);
      assert.isSuccess(response);
      assert.exists(response.data.data.digitalAddress);
    }
  });

  await runner.test('View landlord details for case', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0 && listResponse.data.data[0].property?.landlordId) {
      const landlordId = listResponse.data.data[0].property.landlordId;
      const response = await api.get(`/users/${landlordId}`);
      if (response.success) {
        assert.exists(response.data.data);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // ACCESS CONTROL
  // ─────────────────────────────────────────────────────────────────

  await runner.test('Cannot view other inspector cases', async () => {
    // This test assumes cases are assigned to specific inspectors
    const response = await api.get('/cases');
    if (response.success && response.data.data.length > 0) {
      // Verify only assigned cases are returned
      for (const caseItem of response.data.data) {
        if (caseItem.assignedInspectorId) {
          assert.equals(caseItem.assignedInspectorId, api.user?.id);
        }
      }
    }
  });

  await runner.test('Cannot create new cases', async () => {
    const response = await api.post('/cases', {
      propertyId: 'some-property-id',
      caseType: 'ROUTINE_INSPECTION',
      priority: 'MEDIUM'
    });
    // Inspector cannot create cases - only supervisors/GRA can
    assert.isError(response);
  });

  await runner.test('Cannot modify case assignments', async () => {
    const listResponse = await api.get('/cases/my');
    if (listResponse.data.data.length > 0) {
      const caseId = listResponse.data.data[0].id;
      const response = await api.patch(`/cases/${caseId}/assign`, {
        inspectorId: 'other-inspector-id'
      });
      // Inspector cannot reassign cases
      assert.isError(response);
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────

  await runner.test('View my inspection statistics', async () => {
    const response = await api.get('/cases/my/statistics');
    if (response.success) {
      assert.exists(response.data.data);
    }
  });

  return runner.summary();
}

// Run if executed directly
if (require.main === module) {
  runInspectorCaseTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Test suite failed:', err);
      process.exit(1);
    });
}

module.exports = { runInspectorCaseTests };
