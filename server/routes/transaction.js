const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');

// --- PUBLIC ROUTE ---
router.get('/', controller.getAllTransactions);
router.get('/export', controller.exportTransactions);

module.exports = router;