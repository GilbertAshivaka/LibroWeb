import { useState, useEffect } from 'react'
import { dashboardAPI, licensesAPI } from '../../api'
import { 
  Building2, 
  Key, 
  CreditCard, 
  Download,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, subValue, color = 'coral' }) {
  const colors = {
    coral: 'bg-libro-coral-50 text-libro-coral-500',
    blue: 'bg-libro-blue-50 text-libro-blue-500',
    green: 'bg-libro-green-50 text-libro-green-500',
    amber: 'bg-libro-amber-50 text-libro-amber-500',
  }
  
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-libro-warmgray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-libro-warmgray-800">{value}</p>
          {subValue && (
            <p className="text-sm text-libro-warmgray-500 mt-1">{subValue}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentActivations, setRecentActivations] = useState([])
  const [expiringLicenses, setExpiringLicenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  const fetchDashboardData = async () => {
    try {
      const [statsRes, activationsRes, expiringRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivations(5),
        dashboardAPI.getExpiringLicenses(30),
      ])
      
      setStats(statsRes.data)
      setRecentActivations(activationsRes.data)
      setExpiringLicenses(expiringRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-libro-coral-500 border-t-transparent" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-libro-warmgray-800">Dashboard</h1>
        <p className="text-libro-warmgray-500">Welcome to Libro Admin Portal</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Organizations"
          value={stats?.total_organizations || 0}
          subValue={`${stats?.active_organizations || 0} active`}
          color="coral"
        />
        <StatCard
          icon={Key}
          label="Active Licenses"
          value={stats?.active_licenses || 0}
          subValue={`${stats?.expiring_soon || 0} expiring soon`}
          color="blue"
        />
        <StatCard
          icon={CreditCard}
          label="Revenue This Month"
          value={`$${stats?.revenue_this_month || '0.00'}`}
          subValue={`$${stats?.total_revenue || '0.00'} total`}
          color="green"
        />
        <StatCard
          icon={Download}
          label="Total Downloads"
          value={stats?.total_downloads || 0}
          subValue={`${stats?.activations_today || 0} activations today`}
          color="amber"
        />
      </div>
      
      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activations */}
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-libro-warmgray-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-libro-coral-500" />
              <h2 className="font-semibold text-libro-warmgray-800">Recent Activations</h2>
            </div>
            <Link 
              to="/admin/licenses"
              className="text-sm text-libro-coral-500 hover:text-libro-coral-600 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-libro-warmgray-100">
            {recentActivations.length === 0 ? (
              <p className="p-4 text-libro-warmgray-500 text-sm text-center">
                No recent activations
              </p>
            ) : (
              recentActivations.map((activation) => (
                <div key={activation.id} className="flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-full ${
                    activation.success 
                      ? 'bg-libro-green-50 text-libro-green-500' 
                      : 'bg-libro-coral-50 text-libro-coral-500'
                  }`}>
                    {activation.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-libro-warmgray-800 truncate">
                      {activation.license_key || 'Unknown'}
                    </p>
                    <p className="text-xs text-libro-warmgray-500">
                      {activation.ip_address || 'Unknown IP'}
                    </p>
                  </div>
                  <p className="text-xs text-libro-warmgray-400">
                    {format(new Date(activation.timestamp), 'MMM d, HH:mm')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Expiring Licenses */}
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-libro-warmgray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-libro-amber-500" />
              <h2 className="font-semibold text-libro-warmgray-800">Expiring Soon</h2>
            </div>
            <Link 
              to="/admin/licenses"
              className="text-sm text-libro-coral-500 hover:text-libro-coral-600 flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-libro-warmgray-100">
            {expiringLicenses.length === 0 ? (
              <p className="p-4 text-libro-warmgray-500 text-sm text-center">
                No licenses expiring in the next 30 days
              </p>
            ) : (
              expiringLicenses.slice(0, 5).map((license) => (
                <div key={license.id} className="flex items-center gap-3 p-4">
                  <div className={`p-2 rounded-full ${
                    license.days_remaining <= 7
                      ? 'bg-libro-coral-50 text-libro-coral-500'
                      : 'bg-libro-amber-50 text-libro-amber-500'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-libro-warmgray-800 truncate">
                      {license.organization_name}
                    </p>
                    <p className="text-xs text-libro-warmgray-500">
                      {license.tier_name} • {license.license_key}
                    </p>
                  </div>
                  <span className={`badge ${
                    license.days_remaining <= 7 ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {license.days_remaining} days
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-libro-green-50 rounded-xl">
            <TrendingUp className="w-5 h-5 text-libro-green-500" />
          </div>
          <div>
            <p className="text-sm text-libro-warmgray-500">Activations This Week</p>
            <p className="text-xl font-bold text-libro-warmgray-800">
              {stats?.activations_this_week || 0}
            </p>
          </div>
        </div>
        
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-libro-blue-50 rounded-xl">
            <Key className="w-5 h-5 text-libro-blue-500" />
          </div>
          <div>
            <p className="text-sm text-libro-warmgray-500">Total Licenses</p>
            <p className="text-xl font-bold text-libro-warmgray-800">
              {stats?.total_licenses || 0}
            </p>
          </div>
        </div>
        
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-libro-coral-50 rounded-xl">
            <Activity className="w-5 h-5 text-libro-coral-500" />
          </div>
          <div>
            <p className="text-sm text-libro-warmgray-500">Activations Today</p>
            <p className="text-xl font-bold text-libro-warmgray-800">
              {stats?.activations_today || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
