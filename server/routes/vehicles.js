const express = require('express');
const pool = require('../db');
const { HttpError, orNull, requireFields, buildUpdate, checkId } = require('../helpers');
const { photoUploadParams, requirePhotoUrl } = require('../cloudinary');

const router = express.Router();
router.param('id', checkId);

// Every query filters on user_id from the token, so users can only touch their own vehicles

// List the logged-in user's vehicles
router.get('/vehicles', async (req, res) => {
  const result = await pool.query('SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC, id DESC', [req.user.id]);
  res.json({ success: true, vehicles: result.rows });
});

// Signature for uploading a vehicle photo to Cloudinary. The browser uploads the file itself, then saves
// the returned link as the vehicle's photo (POST or PATCH below)
router.post('/vehicles/photo-upload', async (req, res) => {
  res.json({ success: true, upload: photoUploadParams('vehicle') });
});

// Add a vehicle. Expects { make, model, year } and optionally { vin, current_mileage, photo }
router.post('/vehicles', async (req, res) => {
  const { make, model, year, vin, current_mileage, photo } = req.body;
  requireFields(req.body, ['make', 'model', 'year']);
  requirePhotoUrl(photo);

  const result = await pool.query(
    `INSERT INTO vehicles (user_id, make, model, year, vin, current_mileage, photo)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [req.user.id, make, model, year, orNull(vin), orNull(current_mileage), orNull(photo)]
  );
  res.status(201).json({ success: true, vehicle: result.rows[0] });
});

// Get one vehicle
router.get('/vehicles/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM vehicles WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Vehicle not found.');
  res.json({ success: true, vehicle: result.rows[0] });
});

// Update any of a vehicle's fields. { photo: null } removes the photo
router.patch('/vehicles/:id', async (req, res) => {
  requirePhotoUrl(req.body.photo);
  const { sets, values } = buildUpdate(req.body, ['make', 'model', 'year', 'vin', 'current_mileage', 'photo'], ['make', 'model', 'year']);

  const result = await pool.query(
    `UPDATE vehicles SET ${sets} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING *`,
    [...values, req.params.id, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'Vehicle not found.');
  res.json({ success: true, vehicle: result.rows[0] });
});

// Delete a vehicle (the database also deletes its maintenance records and reminders)
router.delete('/vehicles/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM vehicles WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Vehicle not found.');
  res.json({ success: true, message: 'Vehicle deleted.' });
});

module.exports = router;
