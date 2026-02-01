const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.get('/certificates', authenticate, taxController.getCertificates);
router.get('/certificates/:id', authenticate, taxController.getCertificateById);
router.get('/certificates/:id/download', authenticate, taxController.downloadCertificate);
router.post('/certificates/generate', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.generateCertificate);
router.get('/verify/:code', optionalAuth, taxController.verifyCertificate);
router.get('/summary', authenticate, taxController.getTaxSummary);

module.exports = router;
