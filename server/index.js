/**
 * Entry point of the DriveCare backend. Creates the Express app, registers global middleware, mounts
 * every route file under /api, and starts the HTTP server.
 *
 * **Module name:** server/index  
 * **Programmer(s):** Daniel Ray, Kevin (GitHub: KevOrt04)  
 * **Date:** 2026-09-02 (last updated 2026-10-19)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - Anonymous body-default middleware: input `req, res, next`; sets `req.body` to `{}` when no JSON body
 *   was sent, then calls `next()`.
 * - `GET /` : no input; output is a plain-text health message.
 * - `GET /api/test-db` : no input; output `{ success, message, timestamp }` from `SELECT NOW()`, or a
 *   500 error.
 * - Public routes from `routes/auth.js` are mounted before `requireAuth`; all routes mounted after it
 *   require a valid JWT.
 * - 404 handler and `errorHandler` (from helpers.js) are registered last so every unmatched URL or
 *   thrown error becomes a JSON response.
 *
 * **Important data structures:**
 *
 * The Express middleware stack (an ordered list of functions each request passes through).
 *
 * **Algorithm / design choice:**
 *
 * Middleware chain (Chain of Responsibility): each request passes through CORS, JSON parsing,
 * authentication and finally a router. This was chosen over checking auth inside every route because
 * one `app.use('/api', requireAuth)` line protects every route mounted after it.
 *
 * @module server/index
 * @author Daniel Ray, Kevin (GitHub: KevOrt04)
 * @since 2026-09-02 (last updated 2026-10-19)
 */
// Load environment variables from your server/.env file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { requireAuth } = require('./middleware/auth');
const { errorHandler } = require('./helpers');

const app = express();

// Middleware
app.use(cors());          // Allows your React app to communicate with this API
app.use(express.json());  // Allows your server to parse incoming JSON data
// Requests without a JSON body leave req.body undefined; default it so routes can read fields safely
app.use((req, res, next) => {
  req.body = req.body || {};
  next();
});

// Add a simple test route to check if the backend works
app.get('/', (req, res) => {
  res.send('🚀 Node.js backend is running successfully!');
});

// Add a database test route for your React app
app.get('/api/test-db', async (req, res) => {
  try {
    // Run a simple query to get the current timestamp from Postgres
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Successfully connected to PostgreSQL!',
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    console.error('❌ Database query error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public routes: /api/register and /api/login
app.use('/api', require('./routes/auth'));

// Everything below this line requires a valid JWT. Routes read the user from req.user,
// never from the request body, so users can't read or change each other's data
app.use('/api', requireAuth);
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/vehicles'));
app.use('/api', require('./routes/maintenance'));
app.use('/api', require('./routes/reminders'));
app.use('/api', require('./routes/posts'));
app.use('/api', require('./routes/ai'));

// Unknown URLs
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// Turns errors thrown by any route into a JSON response
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Test the API at: http://localhost:${PORT}/api/test-db`);
});
