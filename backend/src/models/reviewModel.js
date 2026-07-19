const { pool } = require('../config/db');
const { updateRatingAggregate } = require('./destinationModel');

async function upsertReview({ userId, destinationId, rating, title, body }) {
  await pool.query(
    `INSERT INTO reviews (user_id, destination_id, rating, title, body)
     VALUES (:userId, :destinationId, :rating, :title, :body)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), body = VALUES(body)`,
    { userId, destinationId, rating, title, body }
  );
  await updateRatingAggregate(destinationId);
}

async function listForDestination(destinationId) {
  const [rows] = await pool.query(
    `SELECT r.*, u.first_name, u.last_name FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.destination_id = :destinationId ORDER BY r.created_at DESC`,
    { destinationId }
  );
  return rows;
}

async function deleteReview(userId, destinationId) {
  await pool.query('DELETE FROM reviews WHERE user_id = :userId AND destination_id = :destinationId', { userId, destinationId });
  await updateRatingAggregate(destinationId);
}

module.exports = { upsertReview, listForDestination, deleteReview };
