const crypto = require('crypto');
const { HttpError, isBlank } = require('./helpers');

// Car photos are uploaded straight from the browser to Cloudinary. The browser first asks this server for a
// one-time signature, so only logged-in users can upload and the API secret never leaves the server.
// Docs: https://cloudinary.com/documentation/authentication_signatures

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Each kind of photo goes in its own Cloudinary folder
const FOLDERS = {
  vehicle: 'drivecare/vehicles',
  post: 'drivecare/posts',
};

// Cloudinary shrinks anything larger than this on upload, so phone photos don't eat storage
const UPLOAD_TRANSFORMATION = 'c_limit,w_1600,h_1600';

const isConfigured = () => Boolean(CLOUD_NAME && API_KEY && API_SECRET);

// Cloudinary's signature: the upload parameters sorted by name as "a=1&b=2", with the API secret on the end,
// hashed with SHA-1. Cloudinary rejects the upload if the parameters sent don't match what was signed
const signParams = (params) => {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(toSign + API_SECRET).digest('hex');
};

// Everything the browser needs to upload one photo of the given kind ('vehicle' or 'post').
// Signatures expire after an hour on Cloudinary's side
const photoUploadParams = (kind) => {
  if (!isConfigured()) throw new HttpError(503, 'Photo uploads are not set up on the server.');

  const params = {
    folder: FOLDERS[kind],
    timestamp: Math.floor(Date.now() / 1000),
    transformation: UPLOAD_TRANSFORMATION,
  };
  return {
    ...params,
    signature: signParams(params),
    api_key: API_KEY,
    upload_url: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
  };
};

// Photo links (a vehicle's photo, a post's image_url) must be images in this app's Cloudinary account.
// Any other link is refused so the columns can't be used to show arbitrary images from other sites.
// Empty means "no photo" / "remove the photo"
const requirePhotoUrl = (url, field = 'photo') => {
  if (isBlank(url)) return;

  const prefix = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/`;
  if (!CLOUD_NAME || typeof url !== 'string' || !url.startsWith(prefix) || url.length > 500) {
    throw new HttpError(400, `${field} must be an image uploaded through DriveCare.`);
  }
};

module.exports = { photoUploadParams, requirePhotoUrl };
