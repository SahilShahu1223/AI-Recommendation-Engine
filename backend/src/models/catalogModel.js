const { pool } = require('../config/db');

async function getByCategory(category, { limit = 200 } = {}) {
  const [rows] = await pool.query(
    "SELECT * FROM catalog_items WHERE category = :category AND (audience IS NULL OR audience <> 'kids') ORDER BY popularity_score DESC LIMIT :limit",
    { category, limit }
  );
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM catalog_items WHERE id = :id', { id });
  return rows[0] || null;
}

async function search({ category, q }) {
  let sql = "SELECT * FROM catalog_items WHERE (audience IS NULL OR audience <> 'kids')";
  const params = {};
  if (category) {
    sql += ' AND category = :category';
    params.category = category;
  }
  if (q) {
    sql += ' AND (title LIKE :q OR description LIKE :q OR tags LIKE :q)';
    params.q = `%${q}%`;
  }
  sql += ' ORDER BY popularity_score DESC LIMIT 100';
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { getByCategory, getById, search };
