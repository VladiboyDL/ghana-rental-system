const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Anonymous tip (public)
router.post('/anonymous', caseController.submitAnonymousTip);

// My cases - must be before /:id to avoid conflict
router.get('/my', authenticate, authorize(ROLES.INSPECTOR), caseController.getMyCases);

// Stats endpoint
router.get('/stats', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.DISTRICT_OFFICER, ROLES.INSPECTOR), caseController.getCaseStats);

// My statistics - must be before /:id
router.get('/my/statistics', authenticate, authorize(ROLES.INSPECTOR), caseController.getMyStatistics);

// Authenticated routes
router.get('/', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.DISTRICT_OFFICER, ROLES.INSPECTOR), caseController.getCases);
router.get('/:id', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.DISTRICT_OFFICER, ROLES.INSPECTOR), caseController.getCaseById);
router.post('/', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.DISTRICT_OFFICER), caseController.createCase);
router.post('/:id/assign', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.DISTRICT_OFFICER), caseController.assignInspector);
router.post('/:id/start', authenticate, authorize(ROLES.INSPECTOR), caseController.startInspection);
router.post('/:id/notes', authenticate, authorize(ROLES.INSPECTOR), caseController.addNotes);
router.post('/:id/schedule', authenticate, authorize(ROLES.INSPECTOR), caseController.scheduleInspection);
router.post('/:id/reschedule', authenticate, authorize(ROLES.INSPECTOR), caseController.rescheduleInspection);
router.post('/:id/evidence', authenticate, authorize(ROLES.INSPECTOR), caseController.uploadEvidence);
router.post('/:id/report', authenticate, authorize(ROLES.INSPECTOR), caseController.submitReport);
router.post('/:id/close', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.DISTRICT_OFFICER), caseController.closeCase);

module.exports = router;
