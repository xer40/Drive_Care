import { Routes, Route } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Maintenance from './maint&diag.jsx'
import Homepage from './Homepage.jsx'
import Community from "./Pages/community.jsx"
import Layout from "./Components/Layout.jsx"
import RequireAuth from './RequireAuth.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<RequireAuth><Homepage /></RequireAuth>} />

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
      
    </Routes>
  )
}

export default App