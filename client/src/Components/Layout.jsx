import { useEffect, useState } from "react"

import Navbar from "./navbar"
import Topbar from "./Topbar"

import "../Styles/layout.css"
import "../Styles/dark.css"

function Layout({ children }) {

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("drivecare-theme") || "light"
  })

  useEffect(() => {
    localStorage.setItem("drivecare-theme", theme)
  }, [theme])

  // Switches off colour animations just while the theme flips, so the whole page changes in the same frame
  // (parts of the page have different animation speeds, which made them change one after another)
  const toggleTheme = () => {
    const root = document.documentElement
    root.classList.add("dc-theme-switching")

    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    )

    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove("dc-theme-switching"))
    })
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