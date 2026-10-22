import { useNavigate } from "react-router-dom"
import {
  getTokenPayload,
  isLoggedIn
} from "../auth.js"

import "../Styles/topbar.css"

function Topbar() {
  const navigate = useNavigate()

  const userPayload = getTokenPayload()

  const displayName =
    userPayload?.username || "User"

  return (
    <header className="dc-topbar">

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

        <button
          className="dc-notification-btn"
          aria-label="Notifications"
        >

          <span>
            🔔
          </span>

          <span className="dc-notif-dot"></span>

        </button>


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