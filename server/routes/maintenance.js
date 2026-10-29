const express = require('express');
const pool = require('../db');
const { HttpError, orNull, requireFields, requireDates, buildUpdate, checkId, getOwnedVehicle } = require('../helpers');

const router = express.Router();
router.param('id', checkId);
router.param('vehicleId', checkId);

// Records don't store a user_id, so ownership is checked through the vehicle they belong to
const OWNED_BY_USER = 'vehicle_id IN (SELECT id FROM vehicles WHERE user_id = ';

// A service logged at a higher mileage than the vehicle shows means the car has driven at least that far,
// so the vehicle's odometer reading is raised to match. It is never lowered: older records don't wind it back
const raiseVehicleMileage = async (record) => {
  if (record.mileage === null) return;
  await pool.query(
    'UPDATE vehicles SET current_mileage = $2 WHERE id = $1 AND (current_mileage IS NULL OR current_mileage < $2)',
    [record.vehicle_id, record.mileage]
  );
};

// List a vehicle's service history, newest first
router.get('/vehicles/:vehicleId/maintenance', async (req, res) => {
  await getOwnedVehicle(req.user.id, req.params.vehicleId);

  const result = await pool.query(
    'SELECT * FROM maintenance_records WHERE vehicle_id = $1 ORDER BY service_date DESC, id DESC',
    [req.params.vehicleId]
  );
  res.json({ success: true, records: result.rows });
});

// Log a service. Expects { service_type, service_date } and optionally { mileage, cost, service_location }
router.post('/vehicles/:vehicleId/maintenance', async (req, res) => {
  await getOwnedVehicle(req.user.id, req.params.vehicleId);

  const { service_type, service_date, mileage, cost, service_location } = req.body;
  requireFields(req.body, ['service_type', 'service_date']);
  requireDates(req.body, ['service_date']);

  const result = await pool.query(
    `INSERT INTO maintenance_records (vehicle_id, service_type, service_date, mileage, cost, service_location)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.vehicleId, service_type, service_date, orNull(mileage), orNull(cost), orNull(service_location)]
  );
  await raiseVehicleMileage(result.rows[0]);
  res.status(201).json({ success: true, record: result.rows[0] });
});

// Get one record
router.get('/maintenance/:id', async (req, res) => {
  const result = await pool.query(`SELECT * FROM maintenance_records WHERE id = $1 AND ${OWNED_BY_USER}$2)`, [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Maintenance record not found.');
  res.json({ success: true, record: result.rows[0] });
});

// Update any of a record's fields
router.patch('/maintenance/:id', async (req, res) => {
  requireDates(req.body, ['service_date']);
  const { sets, values } = buildUpdate(
    req.body,
    ['service_type', 'service_date', 'mileage', 'cost', 'service_location'],
    ['service_type', 'service_date']
  );

  const result = await pool.query(
    `UPDATE maintenance_records SET ${sets}
     WHERE id = $${values.length + 1} AND ${OWNED_BY_USER}$${values.length + 2}) RETURNING *`,
    [...values, req.params.id, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'Maintenance record not found.');
  await raiseVehicleMileage(result.rows[0]);
  res.json({ success: true, record: result.rows[0] });
});

// Delete a record
router.delete('/maintenance/:id', async (req, res) => {
  const result = await pool.query(
    `DELETE FROM maintenance_records WHERE id = $1 AND ${OWNED_BY_USER}$2) RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'Maintenance record not found.');
  res.json({ success: true, message: 'Maintenance record deleted.' });
});

module.exports = router;
