import { Link, useNavigate } from "react-router-dom"
import {
  getTokenPayload,
  isLoggedIn
} from "../auth.js"

import "../Styles/topbar.css"

function Topbar({ theme, toggleTheme }) {
  const navigate = useNavigate()

  const userPayload = getTokenPayload()

  const displayName =
    userPayload?.username || "User"

  return (
    <header className="dc-topbar">
      <Link className="dc-topbar-title" to="/home">
        <svg
          className="dc-topbar-logo" aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        DriveCare
      </Link>

      {/* Search */}
      <div className="dc-search-container">

        <svg
          className="dc-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle
            cx="11"
            cy="11"
            r="8"
          />

          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
          />

        </svg>

        <input
          type="text"
          placeholder="Search for maintenance tips, parts, or community posts..."
          className="dc-search-input"
        />

      </div>


      {/* Right Side */}
      <div className="dc-topbar-actions">

        {/* Light / Dark Mode Switch */}
        <label className="theme-switch">

          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={toggleTheme}
            aria-label="Toggle dark mode"
          />

          <span className="theme-slider"></span>

        </label>


        <div
          className="dc-user-profile"
          onClick={() => navigate("/profile")}
        >

          <div className="dc-avatar-placeholder">
            {displayName
              .charAt(0)
              .toUpperCase()}
          </div>


          <div className="dc-user-info">

            <span className="dc-user-name">
              {displayName}
            </span>

            <span className="dc-user-role">

              {isLoggedIn()
                ? "Active Driver"
                : "Log In"}

            </span>

          </div>

        </div>

      </div>

    </header>
  )
}

export default Topbar