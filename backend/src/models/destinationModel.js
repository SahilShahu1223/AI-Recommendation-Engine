const { pool } = require('../config/db');

async function getAll({ limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.query(
    'SELECT * FROM destinations ORDER BY popularity_score DESC LIMIT :limit OFFSET :offset',
    { limit, offset }
  );
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM destinations WHERE id = :id', { id });
  return rows[0] || null;
}

async function search({ q, country, type, category, budgetTier, kidFriendly }) {
  let sql = 'SELECT * FROM destinations WHERE 1=1';
  const params = {};

  if (q) {
    sql += ' AND (name ILIKE :q OR country ILIKE :q OR description ILIKE :q)';
    params.q = `%${q}%`;
  }
  if (country) {
    sql += ' AND country = :country';
    params.country = country;
  }
  if (type) {
    sql += ' AND type = :type';
    params.type = type;
  }
  if (category) {
    sql += ' AND :category = ANY(string_to_array(category, \',\'))';
    params.category = category;
  }
  if (budgetTier) {
    sql += ' AND budget_tier = :budgetTier';
    params.budgetTier = budgetTier;
  }
  if (kidFriendly !== undefined) {
    sql += ' AND kid_friendly = :kidFriendly';
    params.kidFriendly = !!kidFriendly;
  }

  sql += ' ORDER BY popularity_score DESC LIMIT 100';
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getCategories() {
  const [rows] = await pool.query('SELECT DISTINCT category FROM destinations');
  const set = new Set();
  rows.forEach((r) => {
    if (r.category) r.category.split(',').forEach((c) => set.add(c.trim()));
  });
  return Array.from(set);
}

async function listByCountry(country, { limit = 20 } = {}) {
  const [rows] = await pool.query(
    "SELECT * FROM destinations WHERE country = :country AND type = 'domestic' ORDER BY popularity_score DESC LIMIT :limit",
    { country, limit }
  );
  return rows;
}

async function listInternational({ limit = 20 } = {}) {
  const [rows] = await pool.query(
    "SELECT * FROM destinations WHERE type = 'international' ORDER BY popularity_score DESC LIMIT :limit",
    { limit }
  );
  return rows;
}

async function updateRatingAggregate(destinationId) {
  await pool.query(
    `UPDATE destinations d
     SET avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE destination_id = d.id),
         rating_count = (SELECT COUNT(*) FROM reviews WHERE destination_id = d.id)
     WHERE d.id = :destinationId`,
    { destinationId }
  );
}

module.exports = {
  getAll, getById, search, getCategories, listByCountry, listInternational, updateRatingAggregate,
};
