const express = require('express');
const router = express.Router();
const controller = require('../controllers/overviewController');

// GET /api/overview/summary
router.get('/summary', controller.getSummary);

// GET /api/overview/utilization
router.get('/utilization', controller.getUtilization);

// GET /api/overview/spending-trend
router.get('/spending-trend', controller.getSpendingTrend);

module.exports = router;