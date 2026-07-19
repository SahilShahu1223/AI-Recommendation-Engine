const wishlistModel = require('../models/wishlistModel');

async function list(req, res, next) {
  try {
    const rows = await wishlistModel.list(req.user.id);
    res.json({ success: true, wishlist: rows });
  } catch (err) { next(err); }
}

async function add(req, res, next) {
  try {
    await wishlistModel.add(req.user.id, req.body.destinationId);
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await wishlistModel.remove(req.user.id, req.params.destinationId);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) { next(err); }
}

module.exports = { list, add, remove };
