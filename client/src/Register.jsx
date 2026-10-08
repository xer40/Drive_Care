import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const backend = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5001';

function Register() {
  const navigate = useNavigate()

  // 1. Unified state variable for tracking credentials
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email:'',
  })

  // Status tracker to show feedback to your user
  const [statusMessage, setStatusMessage] = useState('')
  const [rstmsg, setResetStatus] = useState('')

  // 2. Dynamic input handler that updates tracking state as user types
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // 3. Asynchronous registration request handler
  const wipeDB = async () => {
    try {
      // Points directly to the local backend port hosting your API routes
      const response = await fetch(`${backend}/del_db`, {
        method: 'DELETE',
      })

      const data = await response.json()
      setResetStatus("Database Cleared 🫪")

    }
    catch (error) {
      console.error('Network Error:', error)
      setStatusMessage('Network error. Is your backend server running?')
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault() // Prevents fallback page reload

    // --- EMAIL VALIDATION LOGIC ---
    // This regex ensures there is text, an @, a domain name, and ends strictly with a dot followed by letters (like .com or .net)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(formData.email)) {
      setStatusMessage('Registration failed: Please enter a valid email address (e.g., name@domain.com or .net).')
      return // Stop the function here so it doesn't send the fetch request
    }
    // ------------------------------

    setStatusMessage('Registering...')

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
        // Send the new user back to the login page so they can sign in
        navigate('/', { state: { message: `Account created for ${data.username}. Please log in.` } })
      } else {
        setStatusMessage(`Registration failed: ${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Network Error:', error)
      setStatusMessage('Network error. Is your backend server running?')
    }
  }

  return (
    <>
      <section id="center">
        <div>
          <h1>Create Account</h1>
          <p>
            Sign up below to access your development dashboard.
          </p>
        </div>
        {rstmsg && <p className="rst-msg">{rstmsg}</p>}
        <button onClick={wipeDB}>Reset DB</button>

        {/* 4. Registration form interface targeting onSubmit */}
        <form onSubmit={handleRegister} className="register-form">
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>

        {statusMessage && <p className="status-msg">{statusMessage}</p>}

        <p>
          Already have an account? <Link to="/">Log in</Link>
        </p>
      </section>

      <div className="ticks"></div>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default Register
