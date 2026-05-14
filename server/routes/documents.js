const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentController');
// --- ADD THIS LINE ---
const auth = require('../middleware/auth'); 

// --- PUBLIC ROUTE ---
router.get('/', controller.getAllDocuments);

// Now 'auth' is defined and will work!
router.get('/download/:filename', auth, controller.downloadFile);

module.exports = router;