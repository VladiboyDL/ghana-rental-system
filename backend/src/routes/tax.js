const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// My routes (for landlords) - must be before parameterized routes
router.get('/my-summary', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.getMyTaxSummary);
router.get('/my-history', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.getMyTaxHistory);
router.get('/my-projection', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.getMyTaxProjection);
router.get('/my-compliance', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.getMyCompliance);
router.get('/my-certificates', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.getMyCertificates);

// Calculate tax
router.post('/calculate', authenticate, taxController.calculateTax);

// Request certificate
router.post('/certificates/request', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.requestCertificate);

// Verify certificate (public)
router.get('/certificates/verify/:code', optionalAuth, taxController.verifyCertificate);

// Statistics (GRA/Admin)
router.get('/statistics', authenticate, authorize(ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.SYSTEM_ADMIN), taxController.getTaxStatistics);
router.get('/collection-summary', authenticate, authorize(ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.SYSTEM_ADMIN), taxController.getCollectionSummary);

// Landlord records (GRA)
router.get('/landlord-records', authenticate, authorize(ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.SYSTEM_ADMIN), taxController.getLandlordRecords);
router.get('/landlord/:id', authenticate, authorize(ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.SYSTEM_ADMIN), taxController.getLandlordTaxDetails);

// Reports
router.get('/reports/collection', authenticate, authorize(ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.SYSTEM_ADMIN), taxController.getCollectionReport);
router.get('/reports/compliance', authenticate, authorize(ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.SYSTEM_ADMIN), taxController.getComplianceReport);

// Certificate management
router.get('/certificates', authenticate, taxController.getCertificates);
router.get('/certificates/:id', authenticate, taxController.getCertificateById);
router.get('/certificates/:id/download', authenticate, taxController.downloadCertificate);
router.post('/certificates/generate', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER, ROLES.GRA_SUPERVISOR, ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), taxController.generateCertificate);
router.get('/verify/:code', optionalAuth, taxController.verifyCertificate);
router.get('/summary', authenticate, taxController.getTaxSummary);

module.exports = router;
