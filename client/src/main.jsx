/**
 * Entry point of the React app. Mounts `<App />` inside React StrictMode and the React Router
 * `BrowserRouter`.
 *
 * **Module name:** client/main  
 * **Programmer(s):** Sopnel Saha, Kevin Aguilar, Daniel Ray  
 * **Date:** 2026-09-02 (last updated 2026-10-26)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - `createRoot(...).render(...)`: no input; renders the whole app into the `#root` element of
 *   index.html.
 *
 * @module client/main
 * @author Sopnel Saha, Kevin Aguilar, Daniel Ray
 * @since 2026-09-02 (last updated 2026-10-26)
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)