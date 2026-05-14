const express = require('express');
const router = express.Router();
const controller = require('../controllers/budgetController'); 
const checkRole = require('../middleware/checkRole'); 

// These are safe for Validators to see
router.get('/allocations', controller.getAllAllocations);
router.get('/allocations/:id', controller.getAllocationById);
router.get('/summary', controller.getSummary);

// --- PROTECT THIS ROUTE ---
// Only Admins should be able to CREATE a budget
router.post('/allocations', checkRole('Admin'), controller.createAllocation);

module.exports = router;