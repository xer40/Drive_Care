import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { saveToken } from './auth.js'
import AuthLayout, { AuthField, PasswordField, UserIcon, ArrowRightIcon } from './AuthLayout.jsx'
import loginImage from './assets/loginbg.jpg'


const backend = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5001';

function Login() {
  // Other pages can send a message here, e.g. "Please log in to continue."
  const location = useLocation()
  const navigate = useNavigate()

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  })
  // error decides whether the message is shown in red
  const [status, setStatus] = useState({ text: location.state?.message || '', error: false })
  const [submitting, setSubmitting] = useState(false)

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    })
  }

  // Logs in a returning user and stores the JWT for authenticated requests (e.g. /api/chat)
  const handleLogin = async (event) => {
    event.preventDefault()

    
    

    setStatus({ text: '', error: false })
    setSubmitting(true)

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
        // Keep this user's JWT; protected API calls send it as "Authorization: Bearer <token>"
        saveToken(data.token)
        navigate('/home')
      } else {
        setStatus({ text: data.message || data.error || 'Login failed.', error: true })
      }
    } catch (error) {
      console.error('Network Error:', error)
      setStatus({ text: 'Network error. Is your backend server running?', error: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      image={loginImage}
      heading="Keep your car in its best shape"
      tagline="Track maintenance, get personalized insights, connect with a car community, and more."
      footer={<>Don't have an account? <Link to="/register">Create account</Link></>}
    >
      <h1>Welcome back</h1>
      <p className="auth-subtitle">
        Sign in to access your vehicles, maintenance records, and personalized insights.
      </p>

      <form onSubmit={handleLogin} className="auth-form">
        <AuthField
          label="Username"
          icon={<UserIcon />}
          type="text"
          name="username"
          placeholder="Your username"
          autoComplete="username"
          value={loginData.username}
          onChange={handleLoginChange}
          required
        />

        <PasswordField
          label="Password"
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={loginData.password}
          onChange={handleLoginChange}
          required
        />

        <button
  type="submit"
  className="auth-submit"
  disabled={submitting}
  
>
  {submitting ? 'Signing in...' : <>Sign in <ArrowRightIcon /></>}
</button>

</form>

      {status.text && <p className={`auth-status${status.error ? ' error' : ''}`}>{status.text}</p>}
    </AuthLayout>
  )
}

export default Login
