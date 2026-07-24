// Ensure dotenv is called at the very top before any other imports
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// FORCE the correct Supabase database URL directly to bypass local lookup
// process.env.DATABASE_URL = "postgresql://postgres:sahilshahu1234@db.zorzaqinhfpvrufwfxmd.supabase.co:5432/postgres";

const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

// ONLY run the database test and app.listen if we are NOT in production on Vercel
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      console.log('[db] Attempting to connect to PostgreSQL...');
      await testConnection();
    } catch (err) {
      console.error('[db] Failed to connect to PostgreSQL:', err || err.message);
      console.error('Make sure DATABASE_URL is set correctly in backend/.env');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`[server] Smart Recommend AI API listening on port ${PORT}`);
    });
  })();
}

// Export the app instance so Vercel Serverless Functions can consume it
module.exports = app;