import { Routes, Route } from 'react-router-dom'
import Register from './register.jsx'
import Maintenance from './maint&diag.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default App
