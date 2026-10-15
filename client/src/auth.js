// Helpers for the JWT the backend returns from /api/login and /api/register.
// The token is saved in localStorage and sent as "Authorization: Bearer <token>" on protected API calls

export const getToken = () => localStorage.getItem('token')

export const saveToken = (token) => localStorage.setItem('token', token)

export const logout = () => localStorage.removeItem('token')

// Reads the token's payload ({ id, username, exp }) without verifying it.
// Only the server can verify a token; this is just so the UI knows who is logged in and when the token expires
export const getTokenPayload = () => {
  const token = getToken()
  if (!token) return null

  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

// True if there is a token and it hasn't expired yet. Expired or broken tokens are removed
export const isLoggedIn = () => {
  const payload = getTokenPayload()
  if (payload && payload.exp * 1000 > Date.now()) return true

  logout()
  return false
}
