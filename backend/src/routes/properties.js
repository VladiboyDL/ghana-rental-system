const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Public search
router.get('/search', optionalAuth, propertyController.searchProperties);

// Authenticated routes
router.post('/', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.createProperty);
router.get('/', authenticate, propertyController.getProperties);
router.get('/:id', authenticate, propertyController.getPropertyById);
router.put('/:id', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE, ROLES.SYSTEM_ADMIN), propertyController.updateProperty);
router.post('/:id/photos', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.uploadPhotos);
router.post('/:id/verify', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.requestVerification);

module.exports = router;
