const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Current user
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);

// Admin routes
router.get('/', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), userController.listUsers);
router.get('/landlords', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), userController.getLandlords);
router.get('/tenants', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), userController.getTenants);
router.get('/:id', authenticate, authorize(ROLES.SYSTEM_ADMIN, ROLES.GRA_OFFICER), userController.getUserById);
router.put('/:id/status', authenticate, authorize(ROLES.SYSTEM_ADMIN), userController.updateUserStatus);

module.exports = router;
