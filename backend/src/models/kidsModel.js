const { pool } = require('../config/db');

async function listActivities({ minAge, maxAge, activityType, limit = 50 } = {}) {
  let sql = `SELECT k.*, d.name AS destination_name, d.country, d.image_url AS destination_image
             FROM kids_activities k
             JOIN destinations d ON d.id = k.destination_id
             WHERE 1=1`;
  const params = {};

  if (minAge !== undefined) {
    sql += ' AND k.max_age >= :minAge';
    params.minAge = minAge;
  }
  if (maxAge !== undefined) {
    sql += ' AND k.min_age <= :maxAge';
    params.maxAge = maxAge;
  }
  if (activityType) {
    sql += ' AND k.activity_type = :activityType';
    params.activityType = activityType;
  }

  sql += ' ORDER BY d.popularity_score DESC LIMIT :limit';
  params.limit = limit;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function recommendForAge(age, { limit = 10 } = {}) {
  const [rows] = await pool.query(
    `SELECT k.*, d.name AS destination_name, d.country, d.kid_friendly
     FROM kids_activities k
     JOIN destinations d ON d.id = k.destination_id
     WHERE k.min_age <= :age AND k.max_age >= :age AND d.kid_friendly = TRUE
     ORDER BY d.popularity_score DESC LIMIT :limit`,
    { age, limit }
  );
  return rows;
}

// Kids-only catalog items (movies, books, courses, games, music, restaurants,
// fashion, electronics for children) — lives in its own table, completely
// separate from `catalog_items`, so this content never leaks into the adult
// recommendation engine and adult content never leaks in here.
async function listCatalogItems({ category, limit = 60 } = {}) {
  let sql = 'SELECT * FROM kids_catalog_items WHERE 1=1';
  const params = {};

  if (category) {
    sql += ' AND category = :category';
    params.category = category;
  }

  sql += ' ORDER BY popularity_score DESC LIMIT :limit';
  params.limit = limit;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function catalogCategoryCounts() {
  const [rows] = await pool.query(
    'SELECT category, COUNT(*) AS count FROM kids_catalog_items GROUP BY category'
  );
  return rows;
}

module.exports = { listActivities, recommendForAge, listCatalogItems, catalogCategoryCounts };
