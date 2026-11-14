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