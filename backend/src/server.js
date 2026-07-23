require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await testConnection();
  } catch (err) {
    console.error('[db] Failed to connect to PostgreSQL:', err.message);
    console.error('Make sure DATABASE_URL is set and database/schema.sql has been applied.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] Smart Recommend AI API listening on port ${PORT}`);
  });
})();
