const express = require('express');
const router = express.Router();
const c = require('../controllers/catalogController');
const { requireAuth } = require('../middleware/auth');

router.get('/search', c.search);
router.get('/:category', c.browse);
router.post('/:category/generate', requireAuth, c.generate);

module.exports = router;
