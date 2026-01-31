const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');

// Create short URL
router.post('/api/shorten', urlController.shortenUrl);

// Get URL stats
router.get('/api/stats/:shortCode', urlController.getStats);

// Redirect (this should be last)
router.get('/:shortCode', urlController.redirectUrl);

module.exports = router;