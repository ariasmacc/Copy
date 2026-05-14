const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryController');

// Ito ang magiging GET /api/categories/
router.get('/', controller.getAllCategories);

module.exports = router;