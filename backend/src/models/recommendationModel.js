const { pool } = require('../config/db');

async function createRequest({ userId, interests, purpose, budgetUsd, locationPreference, travelStyle, season }) {
  const [, meta] = await pool.query(
    `INSERT INTO recommendation_requests
      (user_id, interests, purpose, budget_usd, location_preference, travel_style, season)
     VALUES (:userId, :interests, :purpose, :budgetUsd, :locationPreference, :travelStyle, :season)`,
    { userId, interests, purpose, budgetUsd, locationPreference, travelStyle, season }
  );
  return meta.insertId;
}

async function saveResults(requestId, scoredDestinations) {
  if (!scoredDestinations.length) return;

  // Build a multi-row INSERT using positional $N params for PostgreSQL
  const values = [];
  const valueClauses = scoredDestinations.map((d, idx) => {
    const base = idx * 5;
    values.push(requestId, d.id, d.score, d.reason, idx + 1);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });

  await pool.query(
    `INSERT INTO recommendation_results (request_id, destination_id, score, reason, rank_position) VALUES ${valueClauses.join(', ')}`,
    values
  );
  await pool.query(
    'UPDATE recommendation_requests SET result_count = :count WHERE id = :requestId',
    { count: scoredDestinations.length, requestId }
  );
}

async function getHistoryForUser(userId, { limit = 20 } = {}) {
  const [requests] = await pool.query(
    `SELECT * FROM recommendation_requests WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit`,
    { userId, limit }
  );
  for (const req of requests) {
    const [results] = await pool.query(
      `SELECT rr.score, rr.reason, rr.rank_position, d.*
       FROM recommendation_results rr
       JOIN destinations d ON d.id = rr.destination_id
       WHERE rr.request_id = :requestId ORDER BY rr.rank_position ASC`,
      { requestId: req.id }
    );
    req.results = results;
  }
  return requests;
}

async function deleteRequest(userId, requestId) {
  await pool.query('DELETE FROM recommendation_requests WHERE id = :requestId AND user_id = :userId', { requestId, userId });
}

module.exports = { createRequest, saveResults, getHistoryForUser, deleteRequest };
