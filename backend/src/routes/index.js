const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const propertyRoutes = require('./properties');
const contractRoutes = require('./contracts');
const paymentRoutes = require('./payments');
const taxRoutes = require('./tax');
const marketRoutes = require('./market');
const caseRoutes = require('./cases');
const ussdRoutes = require('./ussd');
const adminRoutes = require('./admin');
const notificationRoutes = require('./notifications');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/properties', propertyRoutes);
router.use('/contracts', contractRoutes);
router.use('/payments', paymentRoutes);
router.use('/tax', taxRoutes);
router.use('/market', marketRoutes);
router.use('/cases', caseRoutes);
router.use('/ussd', ussdRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

module.exports = router;
