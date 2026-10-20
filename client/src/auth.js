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

const backend = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5001'

// Calls a protected API route with the token attached, e.g. authFetch('/api/vehicles') or
// authFetch('/api/chat', { method: 'POST', body: { message } }). Returns the JSON response.
// Throws an Error with the server's message if the request fails. If the server says the token is
// missing or expired (401), the user is logged out and sent to the login page
export const authFetch = async (path, { method = 'GET', body } = {}) => {
  const response = await fetch(`${backend}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))

  if (response.status === 401) {
    logout()
    window.location.assign('/')
  }
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status})`)
  }
  return data
}

// True if there is a token and it hasn't expired yet. Expired or broken tokens are removed
export const isLoggedIn = () => {
  const payload = getTokenPayload()
  if (payload && payload.exp * 1000 > Date.now()) return true

  logout()
  return false
}
