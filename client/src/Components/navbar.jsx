import { useNavigate } from "react-router-dom"
import { isLoggedIn, logout } from "../auth.js"

import "../Styles/navbar.css"

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside className="dc-sidebar">

      {/* Logo */}
      <div className="dc-sidebar-logo">

        <svg
          className="dc-logo-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>

        <span className="dc-logo-text">
          DriveCare
        </span>

      </div>


      {/* Main Navigation */}
      <nav className="dc-nav-menu">

        <button
          className="dc-nav-item"
          onClick={() => navigate("/")}
        >
          <span className="dc-nav-icon">⌂</span>
          <span>Home</span>
        </button>


        <button
          className="dc-nav-item"
          onClick={() => navigate("/garage")}
        >
          <span className="dc-nav-icon">🚗</span>
          <span>My Garage</span>
        </button>


        <button
          className="dc-nav-item"
          onClick={() => navigate("/maintenance")}
        >
          <span className="dc-nav-icon">🔧</span>
          <span>Maintenance</span>
        </button>


        <button
          className="dc-nav-item"
          onClick={() => navigate("/reminders")}
        >
          <span className="dc-nav-icon">📅</span>
          <span>Reminders</span>
        </button>


        <button
          className="dc-nav-item"
          onClick={() => navigate("/expenses")}
        >
          <span className="dc-nav-icon">＄</span>
          <span>Expenses</span>
        </button>


        <button
          className="dc-nav-item"
          onClick={() => navigate("/community")}
        >
          <span className="dc-nav-icon">👥</span>
          <span>Community</span>
        </button>

      </nav>


      {/* Bottom Section */}
      <div className="dc-sidebar-footer">

        <div className="dc-unlock-card">

          <div className="dc-unlock-icon">
            👑
          </div>

          <div className="dc-unlock-info">
            <h4>Unlock More</h4>

            <p>
              Premium features coming soon
            </p>
          </div>

          <span className="dc-arrow">
            ›
          </span>

        </div>


        <div className="dc-bottom-links">

          {isLoggedIn() ? (

            <button
              className="dc-bottom-link"
              onClick={handleLogout}
            >
              <span>↪</span>
              <span>Log Out</span>
            </button>

          ) : (

            <button
              className="dc-bottom-link"
              onClick={() => navigate("/login")}
            >
              <span>↪</span>
              <span>Log In</span>
            </button>

          )}

        </div>

      </div>

    </aside>
  )
}

export default Navbar