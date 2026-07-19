const historyModel = require('../models/historyModel');

async function addTravel(req, res, next) {
  try {
    const { destinationId, destinationName, visitedOn, notes } = req.body;
    if (!destinationName) return res.status(400).json({ success: false, message: 'destinationName is required' });
    const id = await historyModel.addTravelHistory({
      userId: req.user.id, destinationId: destinationId || null, destinationName, visitedOn: visitedOn || null, notes,
    });
    res.status(201).json({ success: true, id });
  } catch (err) { next(err); }
}

async function listTravel(req, res, next) {
  try {
    const rows = await historyModel.listTravelHistory(req.user.id);
    res.json({ success: true, history: rows });
  } catch (err) { next(err); }
}

async function listSearch(req, res, next) {
  try {
    const rows = await historyModel.listSearchHistory(req.user.id);
    res.json({ success: true, history: rows });
  } catch (err) { next(err); }
}

module.exports = { addTravel, listTravel, listSearch };
