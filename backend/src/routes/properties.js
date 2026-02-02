const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Public search
router.get('/search', optionalAuth, propertyController.searchProperties);

// My properties (must be before /:id to avoid conflict)
router.get('/my', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.getMyProperties);

// Authenticated routes
router.post('/', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.createProperty);
router.get('/', optionalAuth, propertyController.getProperties);
router.get('/:id', authenticate, propertyController.getPropertyById);
router.put('/:id', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE, ROLES.SYSTEM_ADMIN), propertyController.updateProperty);
router.patch('/:id', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE, ROLES.SYSTEM_ADMIN), propertyController.updateProperty);
router.patch('/:id/availability', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.updateAvailability);
router.post('/:id/list', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.listProperty);
router.delete('/:id', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE, ROLES.SYSTEM_ADMIN), propertyController.deleteProperty);
router.post('/:id/photos', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.uploadPhotos);
router.post('/:id/verify', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), propertyController.requestVerification);

module.exports = router;
