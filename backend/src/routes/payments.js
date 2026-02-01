const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.post('/calculate', authenticate, paymentController.calculateBreakdown);
router.post('/', authenticate, authorize(ROLES.TENANT_INDIVIDUAL, ROLES.TENANT_CORPORATE), paymentController.initiatePayment);
router.get('/', authenticate, paymentController.getPayments);
router.get('/summary', authenticate, paymentController.getPaymentSummary);
router.get('/:id', authenticate, paymentController.getPaymentById);

module.exports = router;
