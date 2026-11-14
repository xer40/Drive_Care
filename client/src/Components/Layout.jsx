/**
 * Shared page frame (sidebar + top bar) around every logged-in page, and owner of the light/dark
 * theme.
 *
 * **Module name:** client/Components/Layout  
 * **Programmer(s):** Angel Saavedra, Daniel Ray  
 * **Date:** 2026-10-12 (last updated 2026-11-11)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - `Layout({ children })`: renders Navbar, Topbar and the page.
 * - `toggleTheme()`: switches theme, saves it to localStorage and briefly turns off CSS transitions so
 *   the whole page changes in one frame.
 *
 * **Important data structures:**
 *
 * `theme` state ('light' | 'dark').
 *
 * **Algorithm / design choice:**
 *
 * Composite: pages are nested inside Layout, which contains Navbar and Topbar. The theme is applied as
 * a class on the page, and observer-style React state re-renders every child when it changes.
 *
 * @module client/Components/Layout
 * @author Angel Saavedra, Daniel Ray
 * @since 2026-10-12 (last updated 2026-11-11)
 */
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