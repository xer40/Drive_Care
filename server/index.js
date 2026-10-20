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
