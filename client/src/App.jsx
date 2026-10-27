import { Routes, Route } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'
import Maintenance from './maint&diag.jsx'
import Homepage from './Homepage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<Homepage />} />
      <Route path="/maintenance" element={<Maintenance />} />
    </Routes>
  )
}

export default App