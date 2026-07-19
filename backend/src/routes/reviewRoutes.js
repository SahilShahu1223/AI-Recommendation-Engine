const express = require('express');
const router = express.Router();
const c = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

router.get('/:destinationId', c.listForDestination);
router.post('/', requireAuth, c.upsert);
router.delete('/:destinationId', requireAuth, c.remove);

module.exports = router;
