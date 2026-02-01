const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');
const { optionalAuth } = require('../middleware/auth');

// All market routes are public
router.get('/rent-check', optionalAuth, marketController.getRentCheck);
router.get('/trends', optionalAuth, marketController.getRentTrends);
router.post('/compare', optionalAuth, marketController.compareToMarket);
router.get('/locations', marketController.getLocations);

module.exports = router;
