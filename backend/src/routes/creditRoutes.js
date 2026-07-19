const express = require('express');
const router = express.Router();
const c = require('../controllers/creditController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, c.getCredits);
router.put('/', requireAuth, c.updateCredits);
router.get('/history', requireAuth, c.getCreditHistory);

module.exports = router;
