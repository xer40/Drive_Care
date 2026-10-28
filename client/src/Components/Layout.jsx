import Navbar from "./navbar"
import Topbar from "./Topbar"
import "../Styles/layout.css"

function Layout({ children }) {
  return (
    <div className="dc-layout">

      <Navbar />

      <div className="dc-main">

        <Topbar />

        <main className="dc-page-content">

          {children}

        </main>

      </div>

    </div>
  )
}

export default Layout