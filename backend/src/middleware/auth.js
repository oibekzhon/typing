const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET } = require('../utils');

// Verifies the token and loads the account behind it. The database lookup is
// what makes a deleted user's still-valid token stop working, so the two steps
// belong together - every protected route needs both.
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  try {
    const { rows } = await pool.query('SELECT id, username FROM users WHERE id = $1', [payload.id]);
    if (!rows.length) {
      // A token for a deleted account is as useless as an expired one, so it
      // gets the same status - the client has one rule to act on, not two.
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    req.currentUser = rows[0];
    next();
  } catch (error) {
    console.error('User lookup error:', error);
    return res.status(500).json({ message: 'User lookup failed.' });
  }
}

module.exports = { authenticate };
