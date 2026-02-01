import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import usePortalStore from './store/portalStore'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import EmbedLayout from './layouts/EmbedLayout'

// Public Pages
import LoginPage from './pages/LoginPage'
import DownloadPage from './pages/DownloadPage'
import HomePage from './pages/public/HomePage'
import RegisterPage from './pages/public/RegisterPage'
import PricingPage from './pages/public/PricingPage'

// Portal Pages (customer-facing)
import PortalLoginPage from './pages/portal/PortalLoginPage'
import PortalDashboardPage from './pages/portal/PortalDashboardPage'
import PortalBillingPage from './pages/portal/PortalBillingPage'

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage'
import OrganizationsPage from './pages/admin/OrganizationsPage'
import OrganizationDetailPage from './pages/admin/OrganizationDetailPage'
import LicensesPage from './pages/admin/LicensesPage'
import AnnouncementsPage from './pages/admin/AnnouncementsPage'
import ReleasesPage from './pages/admin/ReleasesPage'
import PaymentsPage from './pages/admin/PaymentsPage'
import UsersPage from './pages/admin/UsersPage'
import SettingsPage from './pages/admin/SettingsPage'

// Embedded Pages (for Qt WebView)
import EmbedAIPage from './pages/embed/EmbedAIPage'
import EmbedAnnouncementsPage from './pages/embed/EmbedAnnouncementsPage'

// Protected Route Component (Admin)
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-libro-cream-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-libro-coral-500 border-t-transparent"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Protected Portal Route (Customer)
function PortalProtectedRoute({ children }) {
  const { isAuthenticated } = usePortalStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/download" element={<DownloadPage />} />
      
      {/* Customer Portal Routes */}
      <Route path="/portal/login" element={<PortalLoginPage />} />
      <Route 
        path="/portal" 
        element={
          <PortalProtectedRoute>
            <PortalDashboardPage />
          </PortalProtectedRoute>
        } 
      />
      <Route 
        path="/portal/billing" 
        element={
          <PortalProtectedRoute>
            <PortalBillingPage />
          </PortalProtectedRoute>
        } 
      />
      
      {/* Embedded Routes (for Qt WebView - no auth required) */}
      <Route path="/embed" element={<EmbedLayout />}>
        <Route path="ai" element={<EmbedAIPage />} />
        <Route path="announcements" element={<EmbedAnnouncementsPage />} />
      </Route>
      
      {/* Admin Routes (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="licenses" element={<LicensesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="releases" element={<ReleasesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* 404 - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
