const express = require('express');
const router = express.Router();
const c = require('../controllers/kidsController');

router.get('/', c.list);
router.get('/recommend', c.recommendForChild);
router.get('/family', c.recommendForFamily);
router.get('/catalog', c.catalog);
router.get('/catalog/categories', c.catalogCategories);

module.exports = router;
