const { pool } = require('../config/db');

async function addTravelHistory({ userId, destinationId, destinationName, visitedOn, notes }) {
  const [result] = await pool.query(
    `INSERT INTO travel_history (user_id, destination_id, destination_name, visited_on, notes)
     VALUES (:userId, :destinationId, :destinationName, :visitedOn, :notes)`,
    { userId, destinationId, destinationName, visitedOn, notes }
  );
  return result.insertId;
}

async function listTravelHistory(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM travel_history WHERE user_id = :userId ORDER BY visited_on DESC', { userId }
  );
  return rows;
}

async function addSearchHistory({ userId, query, filters }) {
  await pool.query(
    'INSERT INTO search_history (user_id, query, filters) VALUES (:userId, :query, :filters)',
    { userId, query, filters: filters ? JSON.stringify(filters) : null }
  );
}

async function listSearchHistory(userId, { limit = 30 } = {}) {
  const [rows] = await pool.query(
    'SELECT * FROM search_history WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit', { userId, limit }
  );
  return rows;
}

module.exports = { addTravelHistory, listTravelHistory, addSearchHistory, listSearchHistory };
