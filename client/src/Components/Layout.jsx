import Navbar from "./navbar"
import Topbar from "./Topbar"

import "../Styles/layout.css"

function Layout({ children }) {

  return (
    <div className="dc-layout">

      <Topbar />

      <Navbar />

      <div className="dc-main">

        <main className="dc-page-content">
          {children}
        </main>

      </div>

    </div>
  )
}

export default Layout