const { Pool, types } = require('pg');

// By default pg returns int8 and numeric columns as strings and date columns as JS Dates.
// Return ids/counts and costs as numbers, and dates as plain 'YYYY-MM-DD' strings so they
// don't shift a day when converted between time zones
types.setTypeParser(types.builtins.INT8, Number);
types.setTypeParser(types.builtins.NUMERIC, Number);
types.setTypeParser(types.builtins.DATE, (value) => value);

// Configure the connection pool to your cloud database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
