import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saveToken } from './auth.js'
import AuthLayout, { AuthField, PasswordField, UserIcon, MailIcon, ArrowRightIcon } from './AuthLayout.jsx'
import registerImage from './assets/registerbg.png'

const backend = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5001';

function Register() {
  const navigate = useNavigate()

  // 1. Unified state variable for tracking credentials
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email:'',
  })

  // Feedback for the user; error decides whether the message is shown in red
  const [status, setStatus] = useState({ text: '', error: false })
  const [submitting, setSubmitting] = useState(false)

  // 2. Dynamic input handler that updates tracking state as user types
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (event) => {
    event.preventDefault() // Prevents fallback page reload

    // --- EMAIL VALIDATION LOGIC ---
    // This regex ensures there is text, an @, a domain name, and ends strictly with a dot followed by letters (like .com or .net)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(formData.email)) {
      setStatus({ text: 'Enter a valid email address (e.g., name@domain.com or .net).', error: true })
      return // Stop the function here so it doesn't send the fetch request
    }
    // ------------------------------

    setStatus({ text: '', error: false })
    setSubmitting(true)

    try {
      // Points directly to the local backend port hosting your API routes
      const response = await fetch(`${backend}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData) // Destructures seamlessly into req.body
      })

      const data = await response.json()

      if (response.ok) {
        // Registering also logs the user in: keep the JWT so authenticated requests work right away
        saveToken(data.token)
        navigate('/home')
      } else {
        setStatus({ text: data.message || 'Registration failed.', error: true })
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
      image={registerImage}
      heading= { <h1>Your garage <br / > All in one place</h1> }
      tagline="Log every service, get reminders before things are due, and ask our AI assistant when something feels off."
      footer={<>Already have an account? <Link to="/">Sign in</Link></>}
    >
      <h1>Create your account</h1>
      <p className="auth-subtitle">
        Set up your free account to start tracking your vehicles and maintenance.
      </p>

      {/* 4. Registration form interface targeting onSubmit */}
      <form onSubmit={handleRegister} className="auth-form">
        <AuthField
          label="Username"
          icon={<UserIcon />}
          type="text"
          name="username"
          placeholder="Choose a username"
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <AuthField
          label="Email"
          icon={<MailIcon />}
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <PasswordField
          label="Password"
          name="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Creating account...' : <>Create account <ArrowRightIcon /></>}
        </button>
      </form>

      {status.text && <p className={`auth-status${status.error ? ' error' : ''}`}>{status.text}</p>}
    </AuthLayout>
  )
}

export default Register
