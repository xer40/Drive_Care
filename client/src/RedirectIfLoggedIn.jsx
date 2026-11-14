/**
 * Wrapper for the login and sign-up pages that sends already logged-in users straight to the homepage.
 *
 * **Module name:** client/RedirectIfLoggedIn  
 * **Programmer(s):** Daniel Ray  
 * **Date:** 2026-11-11
 *
 * **Important functions (inputs -> outputs):**
 *
 * - `RedirectIfLoggedIn({ children })`: returns `<Navigate to="/home" />` if the user has a valid token,
 *   otherwise `children`.
 *
 * @module client/RedirectIfLoggedIn
 * @author Daniel Ray
 * @since 2026-11-11
 */
import { Navigate } from 'react-router-dom'
import { isLoggedIn } from './auth.js'

// Wrap the login and sign-up pages in this. Anyone with a valid token skips them and goes to the homepage
function RedirectIfLoggedIn({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/home" replace />
  }

  return children
}

export default RedirectIfLoggedIn
