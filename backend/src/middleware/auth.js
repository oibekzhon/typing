const jwt = require('jsonwebtoken');
const { pool } = require('../db');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

async function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const { rows } = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found.' });
    }
    req.currentUser = rows[0];
    next();
  } catch (error) {
    return res.status(500).json({ message: 'User lookup failed.' });
  }
}

module.exports = { requireAuth, requireUser };
