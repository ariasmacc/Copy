const express = require('express');
const router = express.Router();
const controller = require('../controllers/validationController');

router.get('/queue', controller.getValidationQueue);
router.get('/summary', controller.getSummary);
router.post('/submit', controller.submitDecision);
router.get('/:itemType/:itemId/validators', controller.getValidators);
router.get('/:itemType/:itemId/documents', controller.getDocuments);

module.exports = router;