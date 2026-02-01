import { useState, useEffect } from 'react'
import { Link, useNavigate, Outlet } from 'react-router-dom'
import usePortalStore from '../../store/portalStore'
import { portalAPI } from '../../api'
import {
  BookOpen,
  LayoutDashboard,
  Key,
  CreditCard,
  Download,
  Settings,
  LogOut,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  Calendar,
  Loader2
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

export default function PortalDashboardPage() {
  const navigate = useNavigate()
  const { customer, organization, license, logout, fetchCustomerData } = usePortalStore()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      await fetchCustomerData()
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLogout = () => {
    logout()
    navigate('/portal/login')
  }
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }
  
  const getLicenseStatus = () => {
    if (!license) return { status: 'none', label: 'No License', color: 'text-libro-warmgray-500' }
    if (license.is_revoked) return { status: 'revoked', label: 'Revoked', color: 'text-red-500' }
    
    const daysLeft = differenceInDays(new Date(license.expiry_date), new Date())
    if (daysLeft < 0) return { status: 'expired', label: 'Expired', color: 'text-red-500' }
    if (daysLeft <= 30) return { status: 'expiring', label: `Expires in ${daysLeft} days`, color: 'text-libro-amber-500' }
    return { status: 'active', label: 'Active', color: 'text-libro-green-500' }
  }
  
  const licenseStatus = getLicenseStatus()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-libro-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-libro-coral-500 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-libro-cream-50">
      {/* Header */}
      <header className="bg-white border-b border-libro-warmgray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-libro-coral-400 to-libro-coral-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-libro-warmgray-800">Libro</span>
              <span className="text-sm text-libro-warmgray-400 ml-2">Customer Portal</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-libro-warmgray-600">{customer?.email}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-libro-warmgray-800">
            Welcome, {customer?.full_name || 'User'}
          </h1>
          <p className="text-libro-warmgray-500">Manage your Libro subscription</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Organization Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-libro-coral-50 rounded-lg">
                <Building2 className="w-5 h-5 text-libro-coral-500" />
              </div>
              <h2 className="font-semibold text-libro-warmgray-800">Organization</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-libro-warmgray-500">Name</p>
                <p className="font-medium text-libro-warmgray-800">{organization?.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-libro-warmgray-500">Organization ID</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-libro-warmgray-50 px-3 py-2 rounded-lg text-sm font-mono text-libro-warmgray-800">
                    {organization?.organization_id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(organization?.organization_id, 'Organization ID')}
                    className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-libro-warmgray-400 mt-1">
                  Use this in the desktop app for validation
                </p>
              </div>
              
              <div>
                <p className="text-sm text-libro-warmgray-500">Location</p>
                <p className="text-libro-warmgray-700">{organization?.location || '-'}</p>
              </div>
            </div>
          </div>
          
          {/* License Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-libro-blue-50 rounded-lg">
                  <Key className="w-5 h-5 text-libro-blue-500" />
                </div>
                <h2 className="font-semibold text-libro-warmgray-800">License</h2>
              </div>
              <span className={`text-sm font-medium ${licenseStatus.color}`}>
                {licenseStatus.label}
              </span>
            </div>
            
            {license ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-libro-warmgray-500">License Key</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-libro-warmgray-50 px-3 py-2 rounded-lg text-xs font-mono text-libro-warmgray-800 break-all">
                      {license.license_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(license.license_key, 'License Key')}
                      className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg flex-shrink-0"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-libro-warmgray-500">Plan</p>
                    <p className="font-medium text-libro-warmgray-800">
                      {license.tier?.name || 'Standard'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-libro-warmgray-500">Expires</p>
                    <p className="text-libro-warmgray-700">
                      {format(new Date(license.expiry_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-libro-warmgray-500">Activations</p>
                  <p className="text-libro-warmgray-700">
                    {license.activation_count || 0} / {license.max_activations} devices
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-10 h-10 text-libro-warmgray-300 mx-auto mb-2" />
                <p className="text-libro-warmgray-500">No active license</p>
                <Link to="/portal/billing" className="btn-primary mt-3 inline-block">
                  Get a License
                </Link>
              </div>
            )}
          </div>
          
          {/* Subscription Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-libro-green-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-libro-green-500" />
              </div>
              <h2 className="font-semibold text-libro-warmgray-800">Subscription</h2>
            </div>
            
            {license?.is_trial ? (
              <div className="bg-libro-amber-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-libro-amber-700 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Trial Period</span>
                </div>
                <p className="text-sm text-libro-amber-600">
                  Your trial expires on {format(new Date(license.expiry_date), 'MMMM d, yyyy')}.
                  Upgrade to continue using Libro.
                </p>
              </div>
            ) : licenseStatus.status === 'expiring' ? (
              <div className="bg-libro-amber-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-libro-amber-700 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Expiring Soon</span>
                </div>
                <p className="text-sm text-libro-amber-600">
                  Your subscription expires soon. Renew to avoid interruption.
                </p>
              </div>
            ) : licenseStatus.status === 'active' ? (
              <div className="bg-libro-green-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-libro-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Subscription Active</span>
                </div>
              </div>
            ) : null}
            
            <Link 
              to="/portal/billing" 
              className={`block w-full text-center py-2.5 rounded-xl font-medium transition-colors ${
                license?.is_trial || licenseStatus.status !== 'active'
                  ? 'bg-libro-coral-500 text-white hover:bg-libro-coral-600'
                  : 'bg-libro-warmgray-100 text-libro-warmgray-700 hover:bg-libro-warmgray-200'
              }`}
            >
              {license?.is_trial ? 'Upgrade Now' : licenseStatus.status === 'active' ? 'Manage Subscription' : 'Renew'}
            </Link>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-libro-warmgray-800 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/download" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="p-2 bg-libro-coral-50 rounded-lg">
                <Download className="w-5 h-5 text-libro-coral-500" />
              </div>
              <div>
                <p className="font-medium text-libro-warmgray-800">Download App</p>
                <p className="text-sm text-libro-warmgray-500">Get the latest version</p>
              </div>
            </Link>
            
            <button 
              onClick={() => copyToClipboard(organization?.organization_id, 'Organization ID')}
              className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <div className="p-2 bg-libro-blue-50 rounded-lg">
                <Copy className="w-5 h-5 text-libro-blue-500" />
              </div>
              <div>
                <p className="font-medium text-libro-warmgray-800">Copy Org ID</p>
                <p className="text-sm text-libro-warmgray-500">For desktop app setup</p>
              </div>
            </button>
            
            <button 
              onClick={() => copyToClipboard(license?.license_key, 'License Key')}
              className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left"
              disabled={!license}
            >
              <div className="p-2 bg-libro-green-50 rounded-lg">
                <Key className="w-5 h-5 text-libro-green-500" />
              </div>
              <div>
                <p className="font-medium text-libro-warmgray-800">Copy License</p>
                <p className="text-sm text-libro-warmgray-500">For activation</p>
              </div>
            </button>
            
            <Link to="/portal/billing" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="p-2 bg-libro-amber-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-libro-amber-500" />
              </div>
              <div>
                <p className="font-medium text-libro-warmgray-800">Billing</p>
                <p className="text-sm text-libro-warmgray-500">Manage payments</p>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Desktop App Setup Instructions */}
        <div className="mt-8 card p-6">
          <h2 className="text-lg font-semibold text-libro-warmgray-800 mb-4">
            Desktop App Setup
          </h2>
          <div className="bg-libro-warmgray-50 rounded-xl p-4">
            <p className="text-libro-warmgray-700 mb-4">
              To set up the Libro desktop application, you'll need:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-libro-warmgray-600">
              <li>
                <strong>Organization ID:</strong>{' '}
                <code className="bg-white px-2 py-0.5 rounded text-sm">{organization?.organization_id}</code>
              </li>
              <li>
                <strong>License Key:</strong>{' '}
                <code className="bg-white px-2 py-0.5 rounded text-sm text-xs">{license?.license_key || 'N/A'}</code>
              </li>
            </ol>
            <p className="text-sm text-libro-warmgray-500 mt-4">
              Enter these credentials when prompted during the desktop app's first launch.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
