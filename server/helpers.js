const pool = require('./db');

// Throw this from any route to send a specific status + message to the client
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

// Forms send '' for empty optional inputs; store those as NULL
const orNull = (value) => (isBlank(value) ? null : value);

// Throws a 400 naming the first required field that is missing or empty
const requireFields = (body, fields) => {
  const missing = fields.filter((field) => isBlank(body[field]));
  if (missing.length > 0) {
    throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}.`);
  }
};

const MIN_PASSWORD_LENGTH = 8;

// Checked here as well as in the browser, because requests don't have to come from our pages
const requirePassword = (password) => {
  if (typeof password !== 'string') throw new HttpError(400, 'Password must be text.');
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
};

// Same shape check as the sign-up page: something@something.tld, with no spaces
const requireEmail = (email) => {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
    throw new HttpError(400, 'Enter a valid email address (e.g. name@domain.com).');
  }
};

// Postgres also accepts words like 'yesterday' as dates; only allow real calendar dates as YYYY-MM-DD
const requireDates = (body, fields) => {
  for (const field of fields) {
    if (isBlank(body[field])) continue;
    const value = String(body[field]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      throw new HttpError(400, `${field} must be a date in YYYY-MM-DD format.`);
    }
  }
};

// Builds the "col = $1, col = $2" part of an UPDATE from only the allowed fields present in the body.
// Column names come from the allowed list, never from the request, so this is safe from SQL injection
const buildUpdate = (body, allowed, notBlank = []) => {
  const fields = allowed.filter((field) => body[field] !== undefined);
  if (fields.length === 0) {
    throw new HttpError(400, `Nothing to update. Send at least one of: ${allowed.join(', ')}.`);
  }

  const blank = fields.filter((field) => notBlank.includes(field) && isBlank(body[field]));
  if (blank.length > 0) {
    throw new HttpError(400, `These field(s) can't be empty: ${blank.join(', ')}.`);
  }

  return {
    sets: fields.map((field, i) => `${field} = $${i + 1}`).join(', '),
    values: fields.map((field) => orNull(body[field])),
  };
};

// router.param callback: ids in the URL must be whole numbers, otherwise the record can't exist
const checkId = (req, res, next, value) => {
  if (!/^\d{1,15}$/.test(value)) return next(new HttpError(404, 'Not found.'));
  next();
};

// Returns the vehicle only if it belongs to this user. A 404 (not 403) is used for other
// people's vehicles so ids can't be probed
const getOwnedVehicle = async (userId, vehicleId) => {
  if (!/^\d{1,15}$/.test(String(vehicleId))) throw new HttpError(404, 'Vehicle not found.');

  const result = await pool.query('SELECT * FROM vehicles WHERE id = $1 AND user_id = $2', [vehicleId, userId]);
  if (result.rows.length === 0) throw new HttpError(404, 'Vehicle not found.');
  return result.rows[0];
};

// Today's date as 'YYYY-MM-DD', according to the database. The database runs on the app's local time
// (America/Los_Angeles), while Node's clock is UTC, which is already "tomorrow" every evening. Asking the
// database keeps "today", "this month", "overdue" and so on consistent everywhere
const getToday = async () => (await pool.query('SELECT CURRENT_DATE::text AS today')).rows[0].today;

// Friendly messages for the database constraints
const CONSTRAINT_MESSAGES = {
  users_username_key: 'This username is already taken.',
  users_email_key: 'This email is already registered.',
  vehicles_vin_key: 'A vehicle with this VIN already exists.',
  vehicles_year_check: 'Year must be between 1900 and 2100.',
  vehicles_current_mileage_check: 'Mileage cannot be negative.',
  maintenance_records_mileage_check: 'Mileage cannot be negative.',
  maintenance_records_cost_check: 'Cost cannot be negative.',
  reminders_due_mileage_check: 'Due mileage cannot be negative.',
  reminders_check: 'A reminder needs a due date or a due mileage.',
};

// Express 5 sends errors thrown in async routes here, so routes don't each need a try/catch
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body is not valid JSON.' });
  }

  // PostgreSQL error codes caused by bad input rather than a server fault
  switch (err.code) {
    case '23505': // unique violation
      return res.status(409).json({ success: false, message: CONSTRAINT_MESSAGES[err.constraint] || 'That value is already in use.' });
    case '23514': // check violation
      return res.status(400).json({ success: false, message: CONSTRAINT_MESSAGES[err.constraint] || 'One of the values is out of range.' });
    case '23502': // not null violation
      return res.status(400).json({ success: false, message: `Missing required field: ${err.column}.` });
    case '23503': // foreign key violation
      return res.status(400).json({ success: false, message: 'A referenced record does not exist.' });
    case '22P02': // invalid text representation (e.g. "abc" for a number)
    case '22003': // number out of range
    case '22007': // invalid date format
    case '22008': // date out of range
    case '22001': // string too long
      return res.status(400).json({ success: false, message: 'One of the values has the wrong format or is too long.' });
  }

  console.error('❌ Server error:', err.message);
  return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
};

module.exports = { HttpError, isBlank, orNull, requireFields, requirePassword, requireEmail, requireDates, buildUpdate, checkId, getOwnedVehicle, getToday, errorHandler };
