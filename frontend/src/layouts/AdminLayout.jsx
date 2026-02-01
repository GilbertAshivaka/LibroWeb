import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import {
  LayoutDashboard,
  Building2,
  Key,
  Megaphone,
  Download,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { name: 'Licenses', href: '/admin/licenses', icon: Key },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Releases', href: '/admin/releases', icon: Download },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="min-h-screen bg-libro-cream-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-libro-warmgray-100 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-libro-warmgray-100">
          <div className="w-10 h-10 bg-libro-coral-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-libro-warmgray-800">Libro</h1>
            <p className="text-xs text-libro-warmgray-500">Admin Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-libro-warmgray-400 hover:text-libro-warmgray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-libro-coral-50 text-libro-coral-600'
                    : 'text-libro-warmgray-600 hover:bg-libro-warmgray-50 hover:text-libro-warmgray-800'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        {/* User section */}
        <div className="p-4 border-t border-libro-warmgray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-libro-coral-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-libro-coral-600">
                {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-libro-warmgray-800 truncate">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-libro-warmgray-500 capitalize">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-warmgray-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-libro-warmgray-100">
          <div className="flex items-center gap-4 px-4 py-3 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-libro-warmgray-500 hover:text-libro-warmgray-700 hover:bg-libro-warmgray-50 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
