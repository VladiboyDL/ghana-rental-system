const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Anonymous tip (public)
router.post('/anonymous', caseController.submitAnonymousTip);

// Authenticated routes
router.get('/', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.DISTRICT_OFFICER, ROLES.INSPECTOR), caseController.getCases);
router.get('/:id', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.DISTRICT_OFFICER, ROLES.INSPECTOR), caseController.getCaseById);
router.post('/', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.DISTRICT_OFFICER), caseController.createCase);
router.post('/:id/assign', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.DISTRICT_OFFICER), caseController.assignInspector);
router.post('/:id/schedule', authenticate, authorize(ROLES.INSPECTOR), caseController.scheduleInspection);
router.post('/:id/evidence', authenticate, authorize(ROLES.INSPECTOR), caseController.uploadEvidence);
router.post('/:id/report', authenticate, authorize(ROLES.INSPECTOR), caseController.submitReport);
router.post('/:id/close', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.DISTRICT_OFFICER), caseController.closeCase);

module.exports = router;
