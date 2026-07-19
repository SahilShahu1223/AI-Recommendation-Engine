const { pool } = require('../config/db');

async function createSession({ userId, refreshToken, userAgent, ipAddress, expiresAt }) {
  const [result] = await pool.query(
    `INSERT INTO sessions (user_id, refresh_token, user_agent, ip_address, expires_at)
     VALUES (:userId, :refreshToken, :userAgent, :ipAddress, :expiresAt)`,
    { userId, refreshToken, userAgent, ipAddress, expiresAt }
  );
  return result.insertId;
}

async function findActiveSession(refreshToken) {
  const [rows] = await pool.query(
    `SELECT * FROM sessions WHERE refresh_token = :refreshToken AND revoked = FALSE AND expires_at > NOW() LIMIT 1`,
    { refreshToken }
  );
  return rows[0] || null;
}

async function revokeSession(refreshToken) {
  await pool.query('UPDATE sessions SET revoked = TRUE WHERE refresh_token = :refreshToken', { refreshToken });
}

async function revokeAllForUser(userId) {
  await pool.query('UPDATE sessions SET revoked = TRUE WHERE user_id = :userId', { userId });
}

module.exports = { createSession, findActiveSession, revokeSession, revokeAllForUser };
