const express = require('express');
const router = express.Router();
const c = require('../controllers/recommendationController');
const { requireAuth } = require('../middleware/auth');

router.post('/generate', requireAuth, c.generate);
router.get('/history', requireAuth, c.history);
router.delete('/history/:requestId', requireAuth, c.deleteHistoryItem);
router.post('/save', requireAuth, c.saveRecommendation);
router.get('/saved', requireAuth, c.listSaved);
router.delete('/saved/:destinationId', requireAuth, c.deleteSavedRecommendation);

module.exports = router;
