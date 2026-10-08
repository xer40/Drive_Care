import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      {/* Login is the landing page; new users follow its link to /register */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Send any unknown URL back to the login page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
export default App

