/**
 * Profile routes for the logged-in user.
 *
 * **Module name:** server/routes/users  
 * **Programmer(s):** Daniel Ray  
 * **Date:** 2026-10-14 (last updated 2026-10-19)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - `GET /api/users/me` -> the user's profile.
 * - `PATCH /api/users/me`: input any of `{ username, email, avatar_url }`; output the updated user.
 * - `PUT /api/users/me/password`: input `{ current_password, new_password }`; checks the old password
 *   first.
 * - `DELETE /api/users/me`: input `{ password }`; deletes the account.
 * - `GET /api/users/:id` -> another user's public profile.
 * - `verifyPassword(userId, password)` (private): throws 401 if the password is wrong.
 *
 * **Important data structures:**
 *
 * `users` table row (USER_COLUMNS).
 *
 * **Algorithm / design choice:**
 *
 * Sensitive changes re-check the password with bcrypt.compare so a stolen token alone cannot change
 * the password or delete the account.
 *
 * @module server/routes/users
 * @author Daniel Ray
 * @since 2026-10-14 (last updated 2026-10-19)
 */
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { USER_COLUMNS } = require('./auth');
const { HttpError, requireFields, requirePassword, requireEmail, buildUpdate, checkId } = require('../helpers');

const router = express.Router();
router.param('id', checkId);

// Checks the password of the logged-in user before a sensitive change
const verifyPassword = async (userId, password) => {
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const row = result.rows[0];
  const matches = row && typeof password === 'string' ? await bcrypt.compare(password, row.password_hash) : false;
  if (!matches) throw new HttpError(401, 'Password is incorrect.');
};

// Get the logged-in user's own profile
router.get('/users/me', async (req, res) => {
  const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'User not found.');
  res.json({ success: true, user: result.rows[0] });
});

// Update the logged-in user's profile
router.patch('/users/me', async (req, res) => {
  const { sets, values } = buildUpdate(req.body, ['username', 'email', 'avatar_url'], ['username', 'email']);
  if (req.body.email !== undefined) requireEmail(req.body.email);

  const result = await pool.query(
    `UPDATE users SET ${sets} WHERE id = $${values.length + 1} RETURNING ${USER_COLUMNS}`,
    [...values, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'User not found.');
  res.json({ success: true, user: result.rows[0] });
});

// Change password. Expects { current_password, new_password }
router.put('/users/me/password', async (req, res) => {
  const { current_password, new_password } = req.body;
  requireFields(req.body, ['current_password', 'new_password']);
  requirePassword(new_password);

  await verifyPassword(req.user.id, current_password);

  const hashedPassword = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.id]);
  res.json({ success: true, message: 'Password updated.' });
});

// Delete the logged-in user's account. Expects { password }.
// The database cascades this to their vehicles, records, reminders, posts, comments, likes and conversations
router.delete('/users/me', async (req, res) => {
  requireFields(req.body, ['password']);
  await verifyPassword(req.user.id, req.body.password);

  await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
  res.json({ success: true, message: 'Account deleted.' });
});

// Public profile of any user (no email), e.g. for showing a post's author
router.get('/users/:id', async (req, res) => {
  const result = await pool.query('SELECT id, username, avatar_url, created_at FROM users WHERE id = $1', [req.params.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'User not found.');
  res.json({ success: true, user: result.rows[0] });
});

module.exports = router;
