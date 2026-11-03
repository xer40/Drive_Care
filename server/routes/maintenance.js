const express = require('express');
const pool = require('../db');
const { HttpError, orNull, requireFields, requireDates, buildUpdate, checkId, getOwnedVehicle, getToday } = require('../helpers');
const { withCategory, categorize, CATEGORY_NAMES, CATEGORY_ICONS } = require('../maintenanceCategories');

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

// Every record returned by these routes also has { category, category_icon }, worked out from service_type
// (see maintenanceCategories.js), e.g. "Front brake pads" -> Brakes 🛑

// List a vehicle's service history, newest first
router.get('/vehicles/:vehicleId/maintenance', async (req, res) => {
  await getOwnedVehicle(req.user.id, req.params.vehicleId);

  const result = await pool.query(
    'SELECT * FROM maintenance_records WHERE vehicle_id = $1 ORDER BY service_date DESC, id DESC',
    [req.params.vehicleId]
  );
  res.json({ success: true, records: result.rows.map(withCategory) });
});

// Numbers for the maintenance page's stat cards and costs chart, for one vehicle.
// ?period=year (default, this calendar year), month (this calendar month) or all
router.get('/vehicles/:vehicleId/maintenance/summary', async (req, res) => {
  await getOwnedVehicle(req.user.id, req.params.vehicleId);
  const period = ['year', 'month', 'all'].includes(req.query.period) ? req.query.period : 'year';

  const [records, reminders, today] = await Promise.all([
    pool.query(
      'SELECT * FROM maintenance_records WHERE vehicle_id = $1 ORDER BY service_date DESC, id DESC',
      [req.params.vehicleId]
    ),
    pool.query(
      `SELECT COUNT(*) AS upcoming,
              COUNT(*) FILTER (WHERE (r.due_date IS NOT NULL AND r.due_date < CURRENT_DATE)
                                  OR (r.due_mileage IS NOT NULL AND v.current_mileage >= r.due_mileage)) AS overdue
       FROM reminders r JOIN vehicles v ON v.id = r.vehicle_id
       WHERE r.vehicle_id = $1 AND NOT r.is_done`,
      [req.params.vehicleId]
    ),
    getToday(),
  ]);

  // Dates are 'YYYY-MM-DD' strings, so comparing them as text works
  const periodStart = { year: `${today.slice(0, 4)}-01-01`, month: `${today.slice(0, 7)}-01`, all: '' }[period];
  const inPeriod = records.rows.filter((r) => r.service_date >= periodStart);

  const sum = (rows) => Math.round(rows.reduce((total, r) => total + Number(r.cost || 0), 0) * 100) / 100;
  const totalSpent = sum(inPeriod);

  // Every category is listed (with 0 when unused), always in the same order, so the chart legend doesn't jump around
  const costByCategory = CATEGORY_NAMES.map((category) => {
    const total = sum(inPeriod.filter((r) => categorize(r.service_type).name === category));
    return {
      category,
      icon: CATEGORY_ICONS[category],
      total,
      percent: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0,
    };
  });

  res.json({
    success: true,
    period,
    total_records: records.rows.length,
    records_in_period: inPeriod.length,
    total_spent: totalSpent,
    total_spent_all_time: sum(records.rows),
    last_service: records.rows[0] ? withCategory(records.rows[0]) : null,
    upcoming_services: reminders.rows[0].upcoming,
    overdue_services: reminders.rows[0].overdue,
    cost_by_category: costByCategory,
  });
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
  res.status(201).json({ success: true, record: withCategory(result.rows[0]) });
});

// Get one record
router.get('/maintenance/:id', async (req, res) => {
  const result = await pool.query(`SELECT * FROM maintenance_records WHERE id = $1 AND ${OWNED_BY_USER}$2)`, [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Maintenance record not found.');
  res.json({ success: true, record: withCategory(result.rows[0]) });
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
  res.json({ success: true, record: withCategory(result.rows[0]) });
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
