import { Routes, Route } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './register.jsx'
import Maintenance from './maint&diag.jsx'
import RequireAuth from './RequireAuth.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Logged-in only: users without a valid token are sent back to the login page */}
      <Route path="/maintenance" element={<RequireAuth><Maintenance /></RequireAuth>} />
    </Routes>
  )
}

export default App