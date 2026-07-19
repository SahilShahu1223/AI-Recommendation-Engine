const express = require('express');
const router = express.Router();
const c = require('../controllers/historyController');
const { requireAuth } = require('../middleware/auth');

router.post('/travel', requireAuth, c.addTravel);
router.get('/travel', requireAuth, c.listTravel);
router.get('/search', requireAuth, c.listSearch);

module.exports = router;
