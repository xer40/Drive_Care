const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { signToken } = require('../middleware/auth');
const { HttpError, requireFields, requirePassword, requireEmail } = require('../helpers');

const router = express.Router();

// Columns that are safe to send to the client (never the password hash)
const USER_COLUMNS = 'id, username, email, avatar_url, created_at, updated_at';

// Create/Register a New User with Hashed Password
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  requireFields(req.body, ['username', 'email', 'password']);
  requireEmail(email);
  requirePassword(password);

  // Generate salt and hash the plain text password asynchronously
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // A duplicate username or email is rejected by the database and turned into a 409 by the error handler
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING ${USER_COLUMNS}`,
    [String(username).trim(), String(email).trim(), hashedPassword]
  );
  const user = result.rows[0];

  console.log(`Successfully created user: ${user.username}`);
  return res.status(201).json({
    success: true,
    message: 'User registered successfully!',
    username: user.username,
    user,
    // Sent so a new user is logged in straight away instead of having to sign in again
    token: signToken(user),
  });
});

// Log In an Existing User by Checking the Hashed Password
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  requireFields(req.body, ['username', 'password']);

  // Look up the stored hash for this username
  const result = await pool.query(`SELECT ${USER_COLUMNS}, password_hash FROM users WHERE username = $1`, [String(username).trim()]);
  const row = result.rows[0];

  // Compare the plain text password against the stored bcrypt hash
  const passwordMatches = row && typeof password === 'string' ? await bcrypt.compare(password, row.password_hash) : false;

  // Use the same message for unknown users and wrong passwords so attackers can't probe for valid usernames
  if (!passwordMatches) {
    console.log(`Login failed for user: ${username}`);
    throw new HttpError(401, 'Invalid username or password.');
  }

  const { password_hash, ...user } = row;

  console.log(`Successfully logged in user: ${user.username}`);
  return res.json({
    success: true,
    message: 'Login successful!',
    username: user.username,
    user,
    token: signToken(user),
  });
});

module.exports = router;
module.exports.USER_COLUMNS = USER_COLUMNS;
