const kidsModel = require('../models/kidsModel');
const userModel = require('../models/userModel');
const { calculateAge } = require('../services/recommendationEngine');

async function list(req, res, next) {
  try {
    const rows = await kidsModel.listActivities({
      minAge: req.query.minAge ? Number(req.query.minAge) : undefined,
      maxAge: req.query.maxAge ? Number(req.query.maxAge) : undefined,
      activityType: req.query.activityType,
    });
    res.json({ success: true, activities: rows });
  } catch (err) { next(err); }
}

async function recommendForChild(req, res, next) {
  try {
    const age = Number(req.query.age);
    if (Number.isNaN(age)) return res.status(400).json({ success: false, message: 'age query param is required' });
    const rows = await kidsModel.recommendForAge(age);
    res.json({ success: true, activities: rows });
  } catch (err) { next(err); }
}

async function recommendForFamily(req, res, next) {
  // Uses the logged-in user's own DOB-derived age context plus a child age param,
  // so a parent gets family-safe suggestions filtered for the child's age.
  try {
    const childAge = Number(req.query.childAge);
    if (Number.isNaN(childAge)) return res.status(400).json({ success: false, message: 'childAge query param is required' });
    const rows = await kidsModel.recommendForAge(childAge);
    res.json({ success: true, activities: rows });
  } catch (err) { next(err); }
}

async function catalog(req, res, next) {
  try {
    const rows = await kidsModel.listCatalogItems({
      category: req.query.category,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json({ success: true, items: rows });
  } catch (err) { next(err); }
}

async function catalogCategories(req, res, next) {
  try {
    const rows = await kidsModel.catalogCategoryCounts();
    res.json({ success: true, categories: rows });
  } catch (err) { next(err); }
}

module.exports = { list, recommendForChild, recommendForFamily, catalog, catalogCategories };
