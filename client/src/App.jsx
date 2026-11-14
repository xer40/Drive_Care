/**
 * Defines every page URL (client-side routing) and which pages need a login.
 *
 * **Module name:** client/App  
 * **Programmer(s):** Sopnel Saha, Kevin Aguilar, Daniel Ray, Angel Saavedra, Shafayat Ahmed Khan Chowdhury  
 * **Date:** 2026-09-02 (last updated 2026-11-11)
 *
 * **Important functions (inputs -> outputs):**
 *
 * - `App()`: no props; returns the `<Routes>` table: `/`, `/login`, `/register` (wrapped in
 *   RedirectIfLoggedIn) and `/home`, `/maintenance`, `/community`, `/profile` (wrapped in RequireAuth
 *   and Layout).
 *
 * **Important data structures:**
 *
 * React Router route table.
 *
 * **Algorithm / design choice:**
 *
 * Wrapper components (Decorator pattern) add login checks and the shared page frame around each page,
 * instead of repeating that logic inside every page.
 *
 * @module client/App
 * @author Sopnel Saha, Kevin Aguilar, Daniel Ray, Angel Saavedra, Shafayat Ahmed Khan Chowdhury
 * @since 2026-09-02 (last updated 2026-11-11)
 */
import { Routes, Route } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Maintenance from './maint&diag.jsx'
import Homepage from './Homepage.jsx'
import Community from "./Pages/community.jsx"
import Layout from "./Components/Layout.jsx"
import RequireAuth from './RequireAuth.jsx'
import RedirectIfLoggedIn from './RedirectIfLoggedIn.jsx'
import Profile from './profile.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
      <Route path="/login" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
      <Route path="/register" element={<RedirectIfLoggedIn><Register /></RedirectIfLoggedIn>} />

      


      <Route path="/home" element={
    <RequireAuth>
      <Layout>
        <Homepage />
      </Layout>
    </RequireAuth>
  }
/>

      <Route path="/maintenance" element={
        <Layout>
          <RequireAuth><Maintenance /></RequireAuth>
        </Layout>
      } />

      <Route
      path="/community"
      element = {
        <Layout>
          <RequireAuth><Community /></RequireAuth>
        </Layout>
      }
        />

      <Route path="/profile" element={
        <RequireAuth>
        <Layout>
          <Profile />
        </Layout>
    </RequireAuth>
      } />
      
    </Routes>
  )
}

export default App