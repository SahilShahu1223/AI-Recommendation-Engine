/**
 * Seed script: (re)generates a correct bcrypt hash for the demo user.
 * Note: sample_data.sql now ships with a real, pre-verified bcrypt hash for
 * "Passw0rd!" already, so this script is only needed if you change the demo
 * password and want to update it in the database without re-importing.
 * Run with: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function run() {
  const hash = await bcrypt.hash('Passw0rd!', 10);
  await pool.query(
    "UPDATE users SET password_hash = :hash WHERE email = 'demo@smartrecommend.ai'",
    { hash }
  );
  console.log('Demo user password hash updated. Login with demo@smartrecommend.ai / Passw0rd!');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
