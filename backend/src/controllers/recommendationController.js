const destinationModel = require('../models/destinationModel');
const recommendationModel = require('../models/recommendationModel');
const historyModel = require('../models/historyModel');
const savedModel = require('../models/savedModel');
const userModel = require('../models/userModel');
const creditModel = require('../models/creditModel');
const { generateRecommendations } = require('../services/recommendationEngine');

const RECOMMENDATION_COST = 1; // credits per generation

async function generate(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.credits < RECOMMENDATION_COST) {
      return res.status(402).json({ success: false, message: 'Not enough credits. Please top up to generate more recommendations.' });
    }

    const { interests, purpose, budgetUsd, locationPreference, travelStyle, season, topN } = req.body;

    const [allDestinations, travelHistory] = await Promise.all([
      destinationModel.getAll({ limit: 1000 }),
      historyModel.listTravelHistory(req.user.id),
    ]);

    const travelHistoryNames = travelHistory.map((h) => h.destination_name);
    // naive "liked categories" derivation from travel history's linked destinations
    const likedCategories = [];

    const results = generateRecommendations(allDestinations, {
      interests,
      purpose,
      budgetUsd: budgetUsd ? Number(budgetUsd) : null,
      locationPreference,
      travelStyle: travelStyle || user.preferred_travel_style,
      season,
      dateOfBirth: user.date_of_birth,
      userCountry: user.country,
      travelHistoryNames,
      likedCategories,
    }, Number(topN) || 10);

    const requestId = await recommendationModel.createRequest({
      userId: req.user.id,
      interests, purpose,
      budgetUsd: budgetUsd ? Number(budgetUsd) : null,
      locationPreference, travelStyle, season,
    });

    await recommendationModel.saveResults(requestId, results);
    await historyModel.addSearchHistory({ userId: req.user.id, query: interests || purpose || '', filters: { budgetUsd, locationPreference, travelStyle, season } });

    const newBalance = await creditModel.adjustCredits(req.user.id, -RECOMMENDATION_COST, 'recommendation_generated');

    res.json({
      success: true,
      requestId,
      creditsRemaining: newBalance,
      recommendations: results,
    });
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    const rows = await recommendationModel.getHistoryForUser(req.user.id);
    res.json({ success: true, history: rows });
  } catch (err) { next(err); }
}

async function deleteHistoryItem(req, res, next) {
  try {
    await recommendationModel.deleteRequest(req.user.id, req.params.requestId);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
}

async function saveRecommendation(req, res, next) {
  try {
    const { destinationId, requestId } = req.body;
    await savedModel.save(req.user.id, destinationId, requestId || null);
    res.json({ success: true, message: 'Saved' });
  } catch (err) { next(err); }
}

async function deleteSavedRecommendation(req, res, next) {
  try {
    await savedModel.remove(req.user.id, req.params.destinationId);
    res.json({ success: true, message: 'Removed from saved' });
  } catch (err) { next(err); }
}

async function listSaved(req, res, next) {
  try {
    const rows = await savedModel.list(req.user.id);
    res.json({ success: true, saved: rows });
  } catch (err) { next(err); }
}

module.exports = {
  generate, history, deleteHistoryItem, saveRecommendation, deleteSavedRecommendation, listSaved,
};
