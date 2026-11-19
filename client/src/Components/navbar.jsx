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

      {/* Main Navigation */}
      <nav className="dc-nav-menu">

        <button
          className="dc-nav-item"
          onClick={() => navigate("/home")}
        >
          <span className="dc-nav-icon">⌂</span>
          <span>Home</span>
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

            <h4>
              Unlock More
            </h4>

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