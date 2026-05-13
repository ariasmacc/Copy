const express = require('express');
const router = express.Router();
const controller = require('../controllers/expenseController');
const upload = require('../middleware/upload');
const checkRole = require('../middleware/checkRole');

// These are safe for Validators
router.get('/', controller.getAllExpenses);
router.get('/summary', controller.getSummary);
router.get('/:id', controller.getExpenseById); // Ensure this route exists if you use it

// --- PROTECT THIS ROUTE ---
// Only Admins should be able to RECORD an expense
router.post('/', checkRole('Admin'), upload, controller.createExpense);

module.exports = router;