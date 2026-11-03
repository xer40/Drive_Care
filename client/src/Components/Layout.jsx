import { useEffect, useState } from "react"

import Navbar from "./navbar"
import Topbar from "./Topbar"

import "../Styles/layout.css"

function Layout({ children }) {

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("drivecare-theme") || "light"
  })

  useEffect(() => {
    localStorage.setItem("drivecare-theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    )
  }

  return (
    <div className={`dc-layout ${theme}`}>

      <Navbar />

      <div className="dc-main">

        <Topbar
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main className="dc-page-content">
          {children}
        </main>

      </div>

    </div>
  )
}

export default Layout