const { Pool } = require('pg');
require('dotenv').config();

let poolInstance = null;

function getPoolConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  const useSsl = databaseUrl.includes('sslmode=require')
    || databaseUrl.includes('neon.tech')
    || databaseUrl.includes('supabase.co')
    || process.env.NODE_ENV === 'production';

  return {
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

function getPool() {
  if (!poolInstance) {
    const config = getPoolConfig();
    if (!config) {
      throw new Error('DATABASE_URL is required. Set it in backend/.env or Vercel environment variables.');
    }
    poolInstance = new Pool(config);
  }
  return poolInstance;
}

/**
 * Converts :named placeholders to PostgreSQL $1, $2, ...
 */
function convertNamedPlaceholders(sql, params) {
  if (params == null || typeof params !== 'object' || Array.isArray(params)) {
    return { sql, values: params || [] };
  }

  const order = [];
  const values = [];
  const seen = new Map();

  const convertedSql = sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
    if (!seen.has(name)) {
      seen.set(name, order.length);
      order.push(name);
      values.push(params[name]);
    }
    return `$${seen.get(name) + 1}`;
  });

  return { sql: convertedSql, values };
}

function shouldReturnInsertId(sql) {
  return /^\s*INSERT\s+/i.test(sql)
    && !/RETURNING\s+/i.test(sql)
    && !/^\s*INSERT\s+INTO\s+\w+\s*\([^)]+\)\s*SELECT\b/i.test(sql);
}

/**
 * Execute a SQL query.
 * Returns [rows, meta] where meta = { insertId, affectedRows }
 * insertId is the id of the last inserted row (for INSERT statements).
 */
const query = async (sql, params) => {
  let finalSql = sql;

  if (shouldReturnInsertId(finalSql)) {
    finalSql = finalSql.replace(/;\s*$/, '') + ' RETURNING id';
  }

  const { sql: pgSql, values } = convertNamedPlaceholders(finalSql, params);
  const result = await getPool().query(pgSql, values);

  const meta = {
    insertId: result.rows[0]?.id ?? null,
    affectedRows: result.rowCount,
  };

  return [result.rows, meta];
};

async function testConnection() {
  const client = await getPool().connect();
  try {
    await client.query('SELECT 1');
    console.log('[db] PostgreSQL connection OK');
  } finally {
    client.release();
  }
}

module.exports = { pool: { query }, testConnection };
