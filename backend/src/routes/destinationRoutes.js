const express = require('express');
const router = express.Router();
const c = require('../controllers/destinationController');

router.get('/', c.list);
router.get('/search', c.search);
router.get('/categories', c.categories);
router.get('/:id', c.getOne);

module.exports = router;
