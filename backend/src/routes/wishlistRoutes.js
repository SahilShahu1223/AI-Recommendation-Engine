const express = require('express');
const router = express.Router();
const c = require('../controllers/wishlistController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, c.list);
router.post('/', requireAuth, c.add);
router.delete('/:destinationId', requireAuth, c.remove);

module.exports = router;
