/**
 * Wrapper that makes a page logged-in only.
 *
 * **Module name:** client/RequireAuth  
 * **Programmer(s):** Daniel Ray, Shafayat Ahmed Khan Chowdhury  
 * **Date:** 2026-10-14 (last updated 2026-10-28)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - `RequireAuth({ children })`: returns `children` when logged in; otherwise redirects to the login
 *   page (`/`) with the message "Please log in to continue."
 *
 * @module client/RequireAuth
 * @author Daniel Ray, Shafayat Ahmed Khan Chowdhury
 * @since 2026-10-14 (last updated 2026-10-28)
 */
import { Navigate } from 'react-router-dom'
import { isLoggedIn } from './auth.js'

// Wrap a page in this to make it logged-in only. Without a valid token the user is sent to the login page
function RequireAuth({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace state={{ message: 'Please log in to continue.' }} />
  }

  return children
}

export default RequireAuth
