import { authFetch } from './auth.js'

// Photos (cars and community posts) go straight from the browser to Cloudinary. The backend first gives us a
// one-time signature, so only logged-in users can upload and the API secret stays on the server.
// After uploading, save the returned link: a vehicle's `photo`, or a post's `image_url`.

const MAX_BYTES = 10 * 1024 * 1024

// Checks a chosen file before uploading. Returns an error message, or '' if it's fine
export const checkPhotoFile = (file) => {
  if (!file.type.startsWith('image/')) return 'Please choose an image file.'
  if (file.size > MAX_BYTES) return 'Photos must be 10 MB or smaller.'
  return ''
}

// Uploads an image file using a signature from `signaturePath` and returns its Cloudinary link.
// Throws an Error with a readable message on failure
const uploadPhoto = async (file, signaturePath) => {
  const problem = checkPhotoFile(file)
  if (problem) throw new Error(problem)

  const { upload } = await authFetch(signaturePath, { method: 'POST' })

  // These fields must match exactly what the server signed
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', upload.api_key)
  form.append('timestamp', upload.timestamp)
  form.append('signature', upload.signature)
  form.append('folder', upload.folder)
  form.append('transformation', upload.transformation)

  const response = await fetch(upload.upload_url, { method: 'POST', body: form })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error?.message || 'Photo upload failed. Please try again.')

  return data.secure_url
}

export const uploadVehiclePhoto = (file) => uploadPhoto(file, '/api/vehicles/photo-upload')

export const uploadPostPhoto = (file) => uploadPhoto(file, '/api/posts/photo-upload')

// Asks Cloudinary for a copy no wider than maxWidth, keeping the whole picture (no cropping), in the best format
// for the browser. For photos shown at their natural shape, like post photos
export const limitedPhoto = (url, maxWidth) => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url
  return url.replace('/image/upload/', `/image/upload/c_limit,w_${maxWidth},f_auto,q_auto/`)
}

// Asks Cloudinary for a copy cropped to the size it's shown at, in the best format for the browser,
// so pages don't download full-size photos. Links that aren't from Cloudinary are returned unchanged
export const sizedPhoto = (url, width, height) => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url
  return url.replace('/image/upload/', `/image/upload/c_fill,g_auto,w_${width},h_${height},f_auto,q_auto/`)
}
