/**
 * JWT authentication: issues signed login tokens and checks them on protected requests.
 *
 * **Module name:** server/middleware/auth  
 * **Programmer(s):** Daniel Ray  
 * **Date:** 2026-10-14 (last updated 2026-10-19)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - `requireAuth(req, res, next)`: input is a request with header `Authorization: Bearer <token>`. If
 *   the token is valid it sets `req.user = { id, username }` and calls `next()`; otherwise it responds
 *   401.
 * - `signToken(user)`: input `{ id, username }`; output a JWT string signed with `JWT_SECRET` that
 *   expires in 1 hour.
 *
 * **Important data structures:**
 *
 * JWT payload `{ id, username, exp }`.
 *
 * **Algorithm / design choice:**
 *
 * Stateless JWT (HMAC-SHA256 signature) instead of server-side sessions: the server stores nothing per
 * login, which suits a small API and lets the React client keep the token in localStorage.
 *
 * @module server/middleware/auth
 * @author Daniel Ray
 * @since 2026-10-14 (last updated 2026-10-19)
 */
const jwt = require('jsonwebtoken');

// Auth middleware: verifies the JWT sent as "Authorization: Bearer <token>"
// and attaches the logged-in user ({ id, username }) to req.user for the route handler
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'You must be logged in.' });
  }

  try {
    // Throws if the token was tampered with, signed with a different secret, or has expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Tokens issued before users had numeric ids carry no id, so they can't be used anymore
    if (!payload.id) throw new Error('Token has no user id');

    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' });
  }
};

// Issue a signed token the client sends back on future requests to prove who it is
const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

module.exports = { requireAuth, signToken };
