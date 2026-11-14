/**
 * Creates the single PostgreSQL connection pool (Supabase) shared by the whole backend, and sets how
 * Postgres types are converted to JavaScript values.
 *
 * **Module name:** server/db  
 * **Programmer(s):** Daniel Ray  
 * **Date:** 2026-10-14 (last updated 2026-10-19)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - Exports `pool` (pg.Pool). `pool.query(sql, params)` takes a parameterized SQL string and an array of
 *   values and returns a Promise of `{ rows }`.
 *
 * **Important data structures:**
 *
 * `pg.Pool`: a pool of reusable database connections configured from `DATABASE_URL`.
 *
 * **Algorithm / design choice:**
 *
 * Singleton: Node caches modules, so every `require('./db')` returns the same pool. A pool was chosen
 * over opening a new connection per request because connections are slow to create and Supabase limits
 * how many can be open. Type parsers return INT8/NUMERIC as numbers and DATE as 'YYYY-MM-DD' strings
 * so dates never shift by a day across time zones.
 *
 * @module server/db
 * @author Daniel Ray
 * @since 2026-10-14 (last updated 2026-10-19)
 */
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
