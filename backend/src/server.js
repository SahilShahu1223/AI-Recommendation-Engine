require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await testConnection();
  } catch (err) {
    console.error('[db] Failed to connect to MySQL:', err.message);
    console.error('Make sure MySQL is running and .env DB_* values are correct, and that you have imported database/schema.sql');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] Smart Recommend AI API listening on port ${PORT}`);
  });
})();
