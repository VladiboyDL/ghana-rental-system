const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.post('/', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), contractController.createContract);
router.get('/', authenticate, contractController.getContracts);
router.get('/pending', authenticate, authorize(ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE), contractController.getPendingConfirmations);
router.get('/:id', authenticate, contractController.getContractById);
router.post('/:id/confirm', authenticate, authorize(ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE), contractController.confirmContract);
router.post('/:id/object', authenticate, authorize(ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE), contractController.objectToContract);
router.post('/:id/terminate', authenticate, contractController.terminateContract);
router.post('/:id/renew', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), contractController.renewContract);

module.exports = router;
