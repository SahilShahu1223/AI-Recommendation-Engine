const { pool } = require('../config/db');

async function add(userId, destinationId) {
  await pool.query(
    `INSERT INTO wishlist (user_id, destination_id) VALUES (:userId, :destinationId)
     ON CONFLICT (user_id, destination_id) DO NOTHING`,
    { userId, destinationId }
  );
}

async function remove(userId, destinationId) {
  await pool.query('DELETE FROM wishlist WHERE user_id = :userId AND destination_id = :destinationId', { userId, destinationId });
}

async function list(userId) {
  const [rows] = await pool.query(
    `SELECT w.id AS wishlist_id, w.added_at, d.*
     FROM wishlist w JOIN destinations d ON d.id = w.destination_id
     WHERE w.user_id = :userId ORDER BY w.added_at DESC`,
    { userId }
  );
  return rows;
}

module.exports = { add, remove, list };
