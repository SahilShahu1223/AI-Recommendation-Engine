const destinationModel = require('../models/destinationModel');

async function list(req, res, next) {
  try {
    const rows = await destinationModel.getAll({
      limit: Number(req.query.limit) || 50,
      offset: Number(req.query.offset) || 0,
    });
    res.json({ success: true, destinations: rows });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const dest = await destinationModel.getById(req.params.id);
    if (!dest) return res.status(404).json({ success: false, message: 'Destination not found' });
    res.json({ success: true, destination: dest });
  } catch (err) { next(err); }
}

async function search(req, res, next) {
  try {
    const { q, country, type, category, budgetTier, kidFriendly } = req.query;
    const rows = await destinationModel.search({
      q, country, type, category, budgetTier,
      kidFriendly: kidFriendly === undefined ? undefined : kidFriendly === 'true',
    });
    res.json({ success: true, destinations: rows, count: rows.length });
  } catch (err) { next(err); }
}

async function categories(req, res, next) {
  try {
    const cats = await destinationModel.getCategories();
    res.json({ success: true, categories: cats });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, search, categories };
