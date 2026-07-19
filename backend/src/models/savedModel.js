const { pool } = require('../config/db');

async function save(userId, destinationId, requestId = null) {
  await pool.query(
    `INSERT IGNORE INTO saved_recommendations (user_id, destination_id, request_id) VALUES (:userId, :destinationId, :requestId)`,
    { userId, destinationId, requestId }
  );
}

async function remove(userId, destinationId) {
  await pool.query('DELETE FROM saved_recommendations WHERE user_id = :userId AND destination_id = :destinationId', { userId, destinationId });
}

async function list(userId) {
  const [rows] = await pool.query(
    `SELECT s.id AS saved_id, s.saved_at, d.*
     FROM saved_recommendations s JOIN destinations d ON d.id = s.destination_id
     WHERE s.user_id = :userId ORDER BY s.saved_at DESC`,
    { userId }
  );
  return rows;
}

module.exports = { save, remove, list };
