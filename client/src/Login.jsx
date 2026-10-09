import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Login.css'

const backend = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5001';

function Login() {
  // Register sends a success message here after a new account is created
  const location = useLocation()

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  })
  const [loginMessage, setLoginMessage] = useState(location.state?.message || '')

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    })
  }

  // Logs in a returning user and stores the JWT for authenticated requests (e.g. /api/chat)
  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginMessage('Logging in...')

    try {
      const response = await fetch(`${backend}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        // Send this later as "Authorization: Bearer <token>"
        localStorage.setItem('token', data.token)
        setLoginMessage(`Welcome back, ${data.username}!`)
        setLoginData({ username: '', password: '' })
      } else {
        setLoginMessage(`Login failed: ${data.message || data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Network Error:', error)
      setLoginMessage('Network error. Is your backend server running?')
    }
  }

  return (
    <>
      <section id="center">
        <div>
          <h1>Log In</h1>
          <p>
            Welcome back! Sign in to access your dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="register-form">
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={loginData.username}
              onChange={handleLoginChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleLoginChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Log In
          </button>
        </form>

        {loginMessage && <p className="status-msg">{loginMessage}</p>}

        <p>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default Login


