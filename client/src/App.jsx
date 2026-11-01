import { Routes, Route } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Maintenance from './maint&diag.jsx'
import Homepage from './Homepage.jsx'
import Community from "./Pages/community.jsx"
import Layout from "./Components/Layout.jsx"
import RequireAuth from './RequireAuth.jsx'
import Profile from './profile.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      


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
          <Maintenance/>
        </Layout>
      } />

      <Route
      path="/community"
      element = {
        <Layout>
          <Community />
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