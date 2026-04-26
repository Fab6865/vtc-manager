import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Company from './pages/Company'
import Drivers from './pages/Drivers'
import Garage from './pages/Garage'
import Deliveries from './pages/Deliveries'
import Gallery from './pages/Gallery'
import Rankings from './pages/Rankings'
import Shop from './pages/Shop'
import Admin from './pages/Admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="company" element={<Company />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="garage" element={<Garage />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="rankings" element={<Rankings />} />
          <Route path="shop" element={<Shop />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
