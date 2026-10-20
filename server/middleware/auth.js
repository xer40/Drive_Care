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
