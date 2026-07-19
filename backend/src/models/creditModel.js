const { pool } = require('../config/db');
const { getCredits, updateCredits } = require('./userModel');

async function adjustCredits(userId, amount, reason) {
  const current = await getCredits(userId);
  if (current === null) throw Object.assign(new Error('User not found'), { status: 404 });

  const newBalance = current + amount;
  if (newBalance < 0) {
    throw Object.assign(new Error('Insufficient credits'), { status: 400 });
  }

  await updateCredits(userId, newBalance);
  await pool.query(
    'INSERT INTO credit_transactions (user_id, amount, reason, balance_after) VALUES (:userId, :amount, :reason, :newBalance)',
    { userId, amount, reason, newBalance }
  );
  return newBalance;
}

async function history(userId, { limit = 30 } = {}) {
  const [rows] = await pool.query(
    'SELECT * FROM credit_transactions WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit',
    { userId, limit }
  );
  return rows;
}

module.exports = { adjustCredits, history };
