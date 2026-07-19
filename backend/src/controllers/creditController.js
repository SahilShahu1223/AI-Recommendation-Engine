const userModel = require('../models/userModel');
const creditModel = require('../models/creditModel');

async function getCredits(req, res, next) {
  try {
    const credits = await userModel.getCredits(req.user.id);
    res.json({ success: true, credits });
  } catch (err) { next(err); }
}

async function updateCredits(req, res, next) {
  try {
    const { amount, reason } = req.body;
    if (typeof amount !== 'number') {
      return res.status(400).json({ success: false, message: 'amount must be a number (positive to add, negative to deduct)' });
    }
    const newBalance = await creditModel.adjustCredits(req.user.id, amount, reason || 'manual_adjustment');
    res.json({ success: true, credits: newBalance });
  } catch (err) { next(err); }
}

async function getCreditHistory(req, res, next) {
  try {
    const rows = await creditModel.history(req.user.id);
    res.json({ success: true, transactions: rows });
  } catch (err) { next(err); }
}

module.exports = { getCredits, updateCredits, getCreditHistory };
