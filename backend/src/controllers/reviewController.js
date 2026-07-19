const reviewModel = require('../models/reviewModel');

async function listForDestination(req, res, next) {
  try {
    const rows = await reviewModel.listForDestination(req.params.destinationId);
    res.json({ success: true, reviews: rows });
  } catch (err) { next(err); }
}

async function upsert(req, res, next) {
  try {
    const { destinationId, rating, title, body } = req.body;
    if (!destinationId || !rating) {
      return res.status(400).json({ success: false, message: 'destinationId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }
    await reviewModel.upsertReview({ userId: req.user.id, destinationId, rating, title, body });
    res.json({ success: true, message: 'Review saved' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await reviewModel.deleteReview(req.user.id, req.params.destinationId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
}

module.exports = { listForDestination, upsert, remove };
