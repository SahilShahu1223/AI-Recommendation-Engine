const { pool } = require('../config/db');

async function createUser({
  firstName, lastName, email, passwordHash, dateOfBirth,
  gender, country, preferredTravelStyle, credits,
}) {
  const [, meta] = await pool.query(
    `INSERT INTO users
      (first_name, last_name, email, password_hash, date_of_birth, gender, country, preferred_travel_style, credits)
     VALUES (:firstName, :lastName, :email, :passwordHash, :dateOfBirth, :gender, :country, :preferredTravelStyle, :credits)`,
    { firstName, lastName, email, passwordHash, dateOfBirth, gender, country, preferredTravelStyle, credits }
  );
  return meta.insertId;
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = :email LIMIT 1', { email });
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = :id LIMIT 1', { id });
  return rows[0] || null;
}

async function updateProfile(id, fields) {
  const allowed = ['first_name', 'last_name', 'country', 'preferred_travel_style', 'bio', 'avatar_url', 'gender'];
  const sets = [];
  const params = { id };
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = :${key}`);
      params[key] = fields[key];
    }
  }
  if (sets.length === 0) return;
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = :id`, params);
}

async function updateCredits(id, newBalance) {
  await pool.query('UPDATE users SET credits = :newBalance WHERE id = :id', { id, newBalance });
}

async function getCredits(id) {
  const [rows] = await pool.query('SELECT credits FROM users WHERE id = :id', { id });
  return rows[0] ? rows[0].credits : null;
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = :id', { id });
}

module.exports = { createUser, findByEmail, findById, updateProfile, updateCredits, getCredits, deleteUser };
