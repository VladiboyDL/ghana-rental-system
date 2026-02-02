const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// My contracts (must be before /:id to avoid conflict)
router.get('/my', authenticate, contractController.getMyContracts);
router.get('/pending', authenticate, authorize(ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE), contractController.getPendingConfirmations);

router.post('/', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), contractController.createContract);
router.get('/', authenticate, contractController.getContracts);
router.get('/:id', authenticate, contractController.getContractById);
router.get('/:id/payments', authenticate, contractController.getContractPayments);
router.patch('/:id', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), contractController.updateContract);
router.post('/:id/confirm', authenticate, authorize(ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE), contractController.confirmContract);
router.post('/:id/sign', authenticate, contractController.signContract);
router.post('/:id/object', authenticate, authorize(ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE), contractController.objectToContract);
router.post('/:id/cancel', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), contractController.cancelContract);
router.post('/:id/terminate', authenticate, contractController.terminateContract);
router.post('/:id/renew', authenticate, authorize(ROLES.LANDLORD_INDIVIDUAL, ROLES.LANDLORD_CORPORATE), contractController.renewContract);

module.exports = router;
