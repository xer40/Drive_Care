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
