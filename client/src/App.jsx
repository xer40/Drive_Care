import { Routes, Route } from 'react-router-dom'
import Register from './register.jsx'
import Maintenance from './maint&diag.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/register" element={<Register />} />
      <Route path="/maintenance" element={<Maintenance />} />
    </Routes>
  )
}

export default App