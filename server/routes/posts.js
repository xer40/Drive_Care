const express = require('express');
const pool = require('../db');
const { HttpError, isBlank, orNull, requireFields, buildUpdate, checkId, getOwnedVehicle } = require('../helpers');
const { photoUploadParams, requirePhotoUrl } = require('../cloudinary');

const router = express.Router();
router.param('id', checkId);
router.param('postId', checkId);

// Posts are a community feed: any logged-in user can read them, only the author can change them.
// $1 is always the viewer's id, used to work out liked_by_me
const POST_SELECT = `
  SELECT p.*, u.username, u.avatar_url,
         v.make AS vehicle_make, v.model AS vehicle_model, v.year AS vehicle_year,
         (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         EXISTS (SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked_by_me
  FROM posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN vehicles v ON v.id = p.vehicle_id`;

const COMMENT_SELECT = `
  SELECT c.*, u.username, u.avatar_url
  FROM comments c JOIN users u ON u.id = c.user_id`;

const getPost = async (viewerId, postId) => {
  const result = await pool.query(`${POST_SELECT} WHERE p.id = $2`, [viewerId, postId]);
  if (result.rows.length === 0) throw new HttpError(404, 'Post not found.');
  return result.rows[0];
};

const assertPostExists = async (postId) => {
  const result = await pool.query('SELECT 1 FROM posts WHERE id = $1', [postId]);
  if (result.rows.length === 0) throw new HttpError(404, 'Post not found.');
};

const likeCount = async (postId) => {
  const result = await pool.query('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = $1', [postId]);
  return result.rows[0].count;
};

// ---------- Posts ----------

// The feed, newest first. Optional filters: ?topic= (e.g. Brakes, matched ignoring capitals) and
// ?user_id= (one author's posts). Paging with ?limit= (max 100) and ?offset=
router.get('/posts', async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const authorId = /^\d{1,15}$/.test(req.query.user_id || '') ? req.query.user_id : null;
  const topic = isBlank(req.query.topic) ? null : String(req.query.topic).trim();

  const result = await pool.query(
    `${POST_SELECT}
     WHERE ($2::bigint IS NULL OR p.user_id = $2)
       AND ($3::text IS NULL OR lower(p.topic) = lower($3))
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT $4 OFFSET $5`,
    [req.user.id, authorId, topic, limit, offset]
  );
  res.json({ success: true, posts: result.rows });
});

// Topics in use and how many posts each has, most popular first (e.g. for a "Popular Topics" list).
// Defined before /posts/:id so "topics" isn't mistaken for a post id
router.get('/posts/topics', async (req, res) => {
  const result = await pool.query(
    `SELECT topic, COUNT(*) AS post_count FROM posts
     GROUP BY topic ORDER BY post_count DESC, topic LIMIT 50`
  );
  res.json({ success: true, topics: result.rows });
});

// Signature for uploading a post photo to Cloudinary. The browser uploads the file itself, then sends the
// returned link as the post's image_url. Defined before /posts/:id so "photo-upload" isn't taken as an id
router.post('/posts/photo-upload', async (req, res) => {
  res.json({ success: true, upload: photoUploadParams('post') });
});

// Create a post. Expects { topic } and optionally { body, image_url, vehicle_id }.
// image_url must be a photo uploaded through /posts/photo-upload
router.post('/posts', async (req, res) => {
  const { body, image_url, vehicle_id } = req.body;
  requireFields(req.body, ['topic']);
  requirePhotoUrl(image_url, 'image_url');
  const topic = String(req.body.topic).trim();

  // You can only tag one of your own vehicles
  if (!isBlank(vehicle_id)) await getOwnedVehicle(req.user.id, vehicle_id);

  const result = await pool.query(
    `INSERT INTO posts (user_id, vehicle_id, topic, body, image_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [req.user.id, orNull(vehicle_id), topic, orNull(body), orNull(image_url)]
  );
  res.status(201).json({ success: true, post: await getPost(req.user.id, result.rows[0].id) });
});

// Get one post
router.get('/posts/:id', async (req, res) => {
  res.json({ success: true, post: await getPost(req.user.id, req.params.id) });
});

// Edit your own post. { image_url: null } removes the photo
router.patch('/posts/:id', async (req, res) => {
  requirePhotoUrl(req.body.image_url, 'image_url');
  const { sets, values } = buildUpdate(req.body, ['topic', 'body', 'image_url', 'vehicle_id'], ['topic']);
  if (!isBlank(req.body.vehicle_id)) await getOwnedVehicle(req.user.id, req.body.vehicle_id);

  const result = await pool.query(
    `UPDATE posts SET ${sets} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING id`,
    [...values, req.params.id, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'Post not found, or it is not yours.');
  res.json({ success: true, post: await getPost(req.user.id, req.params.id) });
});

// Delete your own post (the database also deletes its comments and likes)
router.delete('/posts/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM posts WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Post not found, or it is not yours.');
  res.json({ success: true, message: 'Post deleted.' });
});

// ---------- Likes ----------

// Like a post. Liking twice is harmless
router.put('/posts/:postId/like', async (req, res) => {
  await assertPostExists(req.params.postId);
  await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.postId, req.user.id]);
  res.json({ success: true, liked_by_me: true, like_count: await likeCount(req.params.postId) });
});

// Remove your like
router.delete('/posts/:postId/like', async (req, res) => {
  await assertPostExists(req.params.postId);
  await pool.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [req.params.postId, req.user.id]);
  res.json({ success: true, liked_by_me: false, like_count: await likeCount(req.params.postId) });
});

// ---------- Comments ----------

// List a post's comments, oldest first
router.get('/posts/:postId/comments', async (req, res) => {
  await assertPostExists(req.params.postId);
  const result = await pool.query(`${COMMENT_SELECT} WHERE c.post_id = $1 ORDER BY c.created_at, c.id`, [req.params.postId]);
  res.json({ success: true, comments: result.rows });
});

// Add a comment. Expects { body }
router.post('/posts/:postId/comments', async (req, res) => {
  requireFields(req.body, ['body']);
  await assertPostExists(req.params.postId);

  const inserted = await pool.query(
    'INSERT INTO comments (post_id, user_id, body) VALUES ($1, $2, $3) RETURNING id',
    [req.params.postId, req.user.id, req.body.body]
  );
  const result = await pool.query(`${COMMENT_SELECT} WHERE c.id = $1`, [inserted.rows[0].id]);
  res.status(201).json({ success: true, comment: result.rows[0] });
});

// Edit your own comment. Expects { body }
router.patch('/comments/:id', async (req, res) => {
  requireFields(req.body, ['body']);

  const updated = await pool.query(
    'UPDATE comments SET body = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
    [req.body.body, req.params.id, req.user.id]
  );
  if (updated.rows.length === 0) throw new HttpError(404, 'Comment not found, or it is not yours.');

  const result = await pool.query(`${COMMENT_SELECT} WHERE c.id = $1`, [req.params.id]);
  res.json({ success: true, comment: result.rows[0] });
});

// Delete your own comment
router.delete('/comments/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Comment not found, or it is not yours.');
  res.json({ success: true, message: 'Comment deleted.' });
});

module.exports = router;
