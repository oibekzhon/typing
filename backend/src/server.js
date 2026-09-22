const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDatabase, pool } = require('./db');
const { normalizeResult, validateResult, JWT_SECRET } = require('./utils');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// When deployed behind a proxy, use the original client IP for rate limiting.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// The local frontend and API run on separate ports, so CORS is enabled here.
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : process.env.NODE_ENV !== 'production';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// This service only returns JSON, so apply the basic response hardening here.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

const AUTH_WINDOW_MS = 15 * 60 * 1000;
// Raised by the test suite, which drives hundreds of attempts from one address.
const AUTH_MAX_ATTEMPTS = Number(process.env.AUTH_MAX_ATTEMPTS) || 10;
// ponytail: per-process counters, so limits are per-instance. Move to Redis if
// the API ever runs on more than one replica.
const authAttempts = new Map();

function rateLimitAuth(req, res, next) {
  const now = Date.now();

  if (authAttempts.size > 5000) {
    for (const [ip, seen] of authAttempts) {
      if (now > seen.resetAt) authAttempts.delete(ip);
    }
  }

  const entry = authAttempts.get(req.ip);
  if (!entry || now > entry.resetAt) {
    authAttempts.set(req.ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return next();
  }

  if (entry.count >= AUTH_MAX_ATTEMPTS) {
    return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
  }

  entry.count += 1;
  next();
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Typing API is running.' });
});

app.post('/api/auth/register', rateLimitAuth, async (req, res) => {
  const { username, password, confirmPassword } = req.body || {};

  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Username, password, and confirm password are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const cleanUsername = String(username).trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 20 || !/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ message: 'Username must be 3-20 characters and contain only letters, numbers, or underscores.' });
  }

  // bcrypt silently ignores anything past 72 bytes, so a longer password would
  // give the user false confidence. Reject it instead of truncating.
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Password must be 8-72 characters long.' });
  }

  if (password.toLowerCase() === cleanUsername.toLowerCase()) {
    return res.status(400).json({ message: 'Password must be different from the username.' });
  }

  try {
    const exists = await pool.query('SELECT 1 FROM users WHERE username = $1', [cleanUsername]);
    if (exists.rows.length) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [cleanUsername, passwordHash],
    );

    const user = rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Could not create account.' });
  }
});

app.post('/api/auth/login', rateLimitAuth, async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const { rows } = await pool.query('SELECT id, username, password_hash FROM users WHERE username = $1', [String(username).trim()]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const passwordMatches = await bcrypt.compare(String(password), user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Could not log in.' });
  }
});

app.post('/api/auth/logout', authenticate, (_req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: { id: req.currentUser.id, username: req.currentUser.username } });
});

app.get('/api/users/me/best', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT wpm, raw_wpm, accuracy, consistency, errors, correct_chars, incorrect_chars, test_duration, created_at
       FROM results
       WHERE user_id = $1
       ORDER BY wpm DESC, accuracy DESC, errors ASC, test_duration ASC
       LIMIT 1`,
      [req.currentUser.id],
    );

    res.json({ best: rows[0] || null });
  } catch (error) {
    console.error('Best result error:', error);
    res.status(500).json({ message: 'Could not fetch your best result.' });
  }
});

// Every user's single best run, ranked globally. Both leaderboard routes read
// this, so a rank shown in one always matches the rank shown in the other.
const RANKED_LEADERBOARD = `
  SELECT u.id, u.username, r.wpm, r.raw_wpm, r.accuracy, r.consistency, r.errors,
         r.correct_chars, r.incorrect_chars, r.test_duration, r.created_at,
         ROW_NUMBER() OVER (
           ORDER BY r.wpm DESC, r.accuracy DESC, r.errors ASC, r.test_duration ASC, r.created_at ASC
         ) AS rank
  FROM (
    SELECT user_id, wpm, raw_wpm, accuracy, consistency, errors, correct_chars,
           incorrect_chars, test_duration, created_at,
           ROW_NUMBER() OVER (
             PARTITION BY user_id
             ORDER BY wpm DESC, accuracy DESC, errors ASC, test_duration ASC, created_at DESC
           ) AS row_num
    FROM results
  ) r
  JOIN users u ON u.id = r.user_id
  WHERE r.row_num = 1
`;

app.get('/api/leaderboard', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  try {
    // Ordering by rank rather than by the sort keys keeps the displayed order
    // and the printed rank in step when two runs tie on every key.
    const { rows } = await pool.query(
      `SELECT * FROM (${RANKED_LEADERBOARD}) ranked ORDER BY rank LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const total = await pool.query(
      `SELECT COUNT(*)::int AS total FROM (
         SELECT user_id
         FROM results
         GROUP BY user_id
       ) best`,
    );

    res.json({ results: rows, page, limit, total: total.rows[0].total });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Could not load leaderboard.' });
  }
});

app.get('/api/leaderboard/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM (${RANKED_LEADERBOARD}) ranked WHERE id = $1`,
      [req.currentUser.id],
    );

    res.json({ entry: rows[0] || null });
  } catch (error) {
    console.error('Current rank error:', error);
    res.status(500).json({ message: 'Could not load your leaderboard rank.' });
  }
});

app.post('/api/tests/result', authenticate, async (req, res) => {
  const payload = normalizeResult(req.body || {});

  const invalid = validateResult(payload);
  if (invalid) {
    return res.status(400).json({ message: invalid });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO results (user_id, wpm, raw_wpm, accuracy, consistency, errors, correct_chars, incorrect_chars, test_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.currentUser.id,
        payload.wpm,
        payload.raw_wpm,
        payload.accuracy,
        payload.consistency,
        Math.round(payload.errors),
        Math.round(payload.correct_chars),
        Math.round(payload.incorrect_chars),
        Math.round(payload.test_duration),
      ],
    );

    const bestResult = await pool.query(
      `SELECT wpm, raw_wpm, accuracy, consistency, errors, correct_chars, incorrect_chars, test_duration
       FROM results
       WHERE user_id = $1
       ORDER BY wpm DESC, accuracy DESC, errors ASC, test_duration ASC
       LIMIT 1`,
      [req.currentUser.id],
    );

    res.status(201).json({ message: 'Result saved successfully.', result: rows[0], best: bestResult.rows[0] || null });
  } catch (error) {
    console.error('Save result error:', error);
    res.status(500).json({ message: 'Could not save result.' });
  }
});

async function waitForDatabase(attempt = 1) {
  try {
    await initDatabase();
    return true;
  } catch (error) {
    if (attempt >= 30) {
      throw error;
    }

    console.warn(`Database not ready yet (attempt ${attempt}). Retrying in 2s...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return waitForDatabase(attempt + 1);
  }
}

async function start() {
  try {
    await waitForDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Typing API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only listen when run directly, so the tests can import the app and bind their
// own ephemeral port.
if (require.main === module) {
  start();
}

module.exports = app;
