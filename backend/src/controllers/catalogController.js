const catalogModel = require('../models/catalogModel');
const { generateCatalogRecommendations } = require('../services/catalogEngine');
const creditModel = require('../models/creditModel');
const userModel = require('../models/userModel');

const VALID_CATEGORIES = [
  'movies', 'books', 'career', 'electronics', 'courses', 'fashion', 'restaurants', 'games', 'music',
];
const RECOMMENDATION_COST = 1;

async function generate(req, res, next) {
  try {
    const { category } = req.params;
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `Unknown category: ${category}` });
    }

    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.credits < RECOMMENDATION_COST) {
      return res.status(402).json({ success: false, message: 'Not enough credits. Please top up to generate more recommendations.' });
    }

    const { interests, purpose, budgetUsd, topN } = req.body;
    const items = await catalogModel.getByCategory(category, { limit: 500 });
    const results = generateCatalogRecommendations(
      items,
      { interests, purpose, budgetUsd: budgetUsd ? Number(budgetUsd) : null },
      Number(topN) || 9
    );

    const newBalance = await creditModel.adjustCredits(req.user.id, -RECOMMENDATION_COST, `${category}_recommendation_generated`);

    res.json({ success: true, category, creditsRemaining: newBalance, recommendations: results });
  } catch (err) { next(err); }
}

async function browse(req, res, next) {
  try {
    const { category } = req.params;
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `Unknown category: ${category}` });
    }
    const items = await catalogModel.getByCategory(category);
    res.json({ success: true, category, items });
  } catch (err) { next(err); }
}

async function search(req, res, next) {
  try {
    const { category, q } = req.query;
    const items = await catalogModel.search({ category, q });
    res.json({ success: true, items, count: items.length });
  } catch (err) { next(err); }
}

module.exports = { generate, browse, search, VALID_CATEGORIES };
