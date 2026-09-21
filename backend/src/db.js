const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://typinguser:typingpass@db:5432/typingdb',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(40) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      wpm DOUBLE PRECISION NOT NULL,
      raw_wpm DOUBLE PRECISION NOT NULL,
      accuracy DOUBLE PRECISION NOT NULL,
      consistency DOUBLE PRECISION NOT NULL,
      errors INTEGER NOT NULL,
      correct_chars INTEGER NOT NULL,
      incorrect_chars INTEGER NOT NULL,
      test_duration INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initDatabase };
