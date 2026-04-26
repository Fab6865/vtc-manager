import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Warehouse, 
  FileText, 
  Image, 
  Trophy, 
  ShoppingBag,
  Settings,
  Truck,
  Menu,
  X
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/company', icon: Building2, label: 'Mon Entreprise' },
  { path: '/drivers', icon: Users, label: 'Chauffeurs' },
  { path: '/garage', icon: Warehouse, label: 'Garage' },
  { path: '/deliveries', icon: FileText, label: 'Facturation' },
  { path: '/gallery', icon: Image, label: 'Galerie' },
  { path: '/rankings', icon: Trophy, label: 'Classement' },
  { path: '/shop', icon: ShoppingBag, label: 'Boutique' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminClicks, setAdminClicks] = useState(0)

  const handleLogoClick = () => {
    setAdminClicks(prev => {
      if (prev >= 4) {
        window.location.href = '/admin'
        return 0
      }
      return prev + 1
    })
    
    setTimeout(() => setAdminClicks(0), 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-dark-900 border-r border-dark-700 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div 
          className="h-16 flex items-center justify-center border-b border-dark-700 cursor-pointer"
          onClick={handleLogoClick}
        >
          <Truck className="w-8 h-8 text-primary-500" />
          {sidebarOpen && (
            <span className="ml-3 text-xl font-bold gradient-text">VTC Manager</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 mx-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white neon-blue'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span className="ml-3">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-12 flex items-center justify-center border-t border-dark-700 text-dark-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-dark-950">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
