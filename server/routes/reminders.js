const express = require('express');
const pool = require('../db');
const { HttpError, orNull, requireFields, requireDates, buildUpdate, checkId, getOwnedVehicle } = require('../helpers');

const router = express.Router();
router.param('id', checkId);
router.param('vehicleId', checkId);

// Reminders don't store a user_id, so ownership is checked through the vehicle they belong to
const OWNED_BY_USER = 'vehicle_id IN (SELECT id FROM vehicles WHERE user_id = ';

// Soonest due date first; reminders with only a mileage come last
const ORDER = 'ORDER BY is_done, due_date NULLS LAST, due_mileage NULLS LAST, id';

// List reminders across all of the user's vehicles (for a dashboard).
// Optional ?done=true or ?done=false to filter
router.get('/reminders', async (req, res) => {
  const done = req.query.done === 'true' ? true : req.query.done === 'false' ? false : null;

  const result = await pool.query(
    `SELECT r.*, v.make, v.model, v.year
     FROM reminders r JOIN vehicles v ON v.id = r.vehicle_id
     WHERE v.user_id = $1 AND ($2::boolean IS NULL OR r.is_done = $2)
     ORDER BY r.is_done, r.due_date NULLS LAST, r.due_mileage NULLS LAST, r.id`,
    [req.user.id, done]
  );
  res.json({ success: true, reminders: result.rows });
});

// List one vehicle's reminders
router.get('/vehicles/:vehicleId/reminders', async (req, res) => {
  await getOwnedVehicle(req.user.id, req.params.vehicleId);

  const result = await pool.query(`SELECT * FROM reminders WHERE vehicle_id = $1 ${ORDER}`, [req.params.vehicleId]);
  res.json({ success: true, reminders: result.rows });
});

// Add a reminder. Expects { service_type } and at least one of { due_date, due_mileage }
router.post('/vehicles/:vehicleId/reminders', async (req, res) => {
  await getOwnedVehicle(req.user.id, req.params.vehicleId);

  const { service_type, due_date, due_mileage } = req.body;
  requireFields(req.body, ['service_type']);
  requireDates(req.body, ['due_date']);

  const result = await pool.query(
    `INSERT INTO reminders (vehicle_id, service_type, due_date, due_mileage)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.vehicleId, service_type, orNull(due_date), orNull(due_mileage)]
  );
  res.status(201).json({ success: true, reminder: result.rows[0] });
});

// Update a reminder, e.g. { is_done: true } to tick it off
router.patch('/reminders/:id', async (req, res) => {
  requireDates(req.body, ['due_date']);
  const { sets, values } = buildUpdate(
    req.body,
    ['service_type', 'due_date', 'due_mileage', 'is_done'],
    ['service_type', 'is_done']
  );

  const result = await pool.query(
    `UPDATE reminders SET ${sets}
     WHERE id = $${values.length + 1} AND ${OWNED_BY_USER}$${values.length + 2}) RETURNING *`,
    [...values, req.params.id, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'Reminder not found.');
  res.json({ success: true, reminder: result.rows[0] });
});

// Delete a reminder
router.delete('/reminders/:id', async (req, res) => {
  const result = await pool.query(`DELETE FROM reminders WHERE id = $1 AND ${OWNED_BY_USER}$2) RETURNING id`, [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Reminder not found.');
  res.json({ success: true, message: 'Reminder deleted.' });
});

module.exports = router;
