import { useRef, useState } from 'react'
import { authFetch } from './auth.js'
import { sizedPhoto, uploadVehiclePhoto } from './cloudinary.js'
import './VehiclePhoto.css'

// Shows a vehicle's photo wherever the car appears. Uses the uploaded Cloudinary photo (resized to fit),
// then `fallback` (e.g. a stock picture), then a plain car placeholder
export function VehiclePhoto({ vehicle, width = 800, height = 500, fallback, className }) {
  const src = sizedPhoto(vehicle?.photo, width, height) || fallback
  const name = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'

  if (!src) {
    return (
      <div className={`vehicle-photo-placeholder ${className || ''}`} role="img" aria-label={`${name} (no photo)`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 11 6.6 6.2A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.2L19 11" />
          <rect x="3" y="11" width="18" height="6" rx="2" />
          <path d="M6 17v2M18 17v2" />
          <circle cx="7.5" cy="14" r="1" />
          <circle cx="16.5" cy="14" r="1" />
        </svg>
      </div>
    )
  }

  return <img src={src} alt={name} className={className} loading="lazy" />
}

// Button that lets the owner pick a new photo for a saved vehicle. Uploads it to Cloudinary, saves the link
// on the vehicle, then calls onUpdated(updatedVehicle) so the page can show it
export function ChangePhotoButton({ vehicle, onUpdated, className }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same file again still triggers a change
    if (!file) return

    setUploading(true)
    try {
      const photo = await uploadVehiclePhoto(file)
      const data = await authFetch(`/api/vehicles/${vehicle.id}`, { method: 'PATCH', body: { photo } })
      onUpdated?.(data.vehicle)
    } catch (err) {
      alert(err.message === 'Failed to fetch' ? "Can't reach the server. Is the backend running?" : err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`vehicle-photo-change ${className || ''}`}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : vehicle.photo ? 'Change photo' : 'Add photo'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </>
  )
}
