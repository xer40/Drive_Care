import { Routes, Route } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Maintenance from './maint&diag.jsx'
import RequireAuth from './RequireAuth.jsx'
import Homepage from './Homepage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/home" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Logged-in only: users without a valid token are sent back to the login page */}
      <Route path="/maintenance" element={<Maintenance />} />
    </Routes>
  )
}

export default App