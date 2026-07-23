/**
 * Apply database/schema.sql and optionally database/sample_data.sql
 * Usage:
 *   DATABASE_URL=postgres://... node database/migrate.js
 *   DATABASE_URL=postgres://... node database/migrate.js --seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`[migrate] Running ${path.basename(filePath)}...`);
  await client.query(sql);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[migrate] DATABASE_URL is required');
    process.exit(1);
  }

  const seed = process.argv.includes('--seed');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await client.connect();
  try {
    await runSqlFile(client, path.join(__dirname, 'schema.sql'));
    if (seed) {
      await runSqlFile(client, path.join(__dirname, 'sample_data.sql'));
    }
    console.log('[migrate] Done.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrate] Failed:', err.message);
  process.exit(1);
});
