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
