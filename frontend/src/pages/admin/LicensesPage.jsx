import { useState, useEffect } from 'react'
import { licensesAPI, organizationsAPI, tiersAPI } from '../../api'
import {
  Key,
  Search,
  Plus,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Ban,
  Settings
} from 'lucide-react'
import { format, addYears } from 'date-fns'
import toast from 'react-hot-toast'

export default function LicensesPage() {
  const [licenses, setLicenses] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [tiers, setTiers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    organization_id: '',
    tier_id: '',
    expiry_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
    max_activations: 5,
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    fetchOrganizations()
    fetchTiers()
  }, [])
  
  useEffect(() => {
    fetchLicenses()
  }, [page, orgFilter, statusFilter])
  
  const fetchLicenses = async () => {
    try {
      setIsLoading(true)
      const response = await licensesAPI.list({
        page,
        page_size: 10,
        organization_id: orgFilter || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      })
      setLicenses(response.data.items)
      setTotalPages(response.data.pages)
    } catch (error) {
      toast.error('Failed to load licenses')
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchOrganizations = async () => {
    try {
      const response = await organizationsAPI.list({ page_size: 1000 })
      setOrganizations(response.data.items)
    } catch (error) {
      console.error('Failed to load organizations')
    }
  }
  
  const fetchTiers = async () => {
    try {
      const response = await tiersAPI.list()
      setTiers(response.data)
    } catch (error) {
      console.error('Failed to load tiers')
    }
  }
  
  const openModal = () => {
    setFormData({
      organization_id: '',
      tier_id: '',
      expiry_date: format(addYears(new Date(), 1), 'yyyy-MM-dd'),
      max_activations: 5,
      notes: '',
    })
    setShowModal(true)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.organization_id || !formData.tier_id) {
      toast.error('Organization and tier are required')
      return
    }
    
    setIsSaving(true)
    
    try {
      const response = await licensesAPI.create({
        ...formData,
        organization_id: parseInt(formData.organization_id),
        tier_id: parseInt(formData.tier_id),
      })
      toast.success(`License generated: ${response.data.license_key}`)
      setShowModal(false)
      fetchLicenses()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate license')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCopy = (key) => {
    navigator.clipboard.writeText(key)
    toast.success('License key copied')
  }
  
  const handleRevoke = async (license) => {
    if (!confirm(`Are you sure you want to revoke license ${license.license_key}?`)) {
      return
    }
    
    try {
      await licensesAPI.revoke(license.id)
      toast.success('License revoked')
      fetchLicenses()
    } catch (error) {
      toast.error('Failed to revoke license')
    }
  }
  
  const handleRenew = async (license) => {
    const days = prompt('Enter number of days to extend:', '365')
    if (!days) return
    
    try {
      await licensesAPI.renew(license.id, parseInt(days))
      toast.success('License renewed')
      fetchLicenses()
    } catch (error) {
      toast.error('Failed to renew license')
    }
  }
  
  const getStatusBadge = (license) => {
    if (license.is_revoked) {
      return <span className="badge badge-danger">Revoked</span>
    }
    if (!license.is_active) {
      return <span className="badge badge-warning">Inactive</span>
    }
    if (new Date(license.expiry_date) < new Date()) {
      return <span className="badge badge-danger">Expired</span>
    }
    return <span className="badge badge-success">Active</span>
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-libro-warmgray-800">Licenses</h1>
          <p className="text-libro-warmgray-500">Manage license keys</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Generate License
        </button>
      </div>
      
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <select
              value={orgFilter}
              onChange={(e) => { setOrgFilter(e.target.value); setPage(1); }}
              className="input"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-libro-coral-500 border-t-transparent" />
          </div>
        ) : licenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-libro-warmgray-500">
            <Key className="w-12 h-12 mb-3 text-libro-warmgray-300" />
            <p>No licenses found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-libro-warmgray-50 border-b border-libro-warmgray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      License Key
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Organization
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Tier
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Expires
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Activations
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-libro-warmgray-100">
                  {licenses.map((license) => (
                    <tr key={license.id} className="hover:bg-libro-warmgray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-libro-warmgray-800">
                            {license.license_key}
                          </code>
                          <button
                            onClick={() => handleCopy(license.license_key)}
                            className="p-1 text-libro-warmgray-400 hover:text-libro-coral-500"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-600">
                        {license.organization?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-600">
                        {license.tier?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-600">
                        {format(new Date(license.expiry_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-600">
                        {license.activation_count || 0} / {license.max_activations}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(license)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {!license.is_revoked && (
                            <>
                              <button
                                onClick={() => handleRenew(license)}
                                className="p-2 text-libro-warmgray-400 hover:text-libro-blue-500 hover:bg-libro-blue-50 rounded-lg"
                                title="Renew"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRevoke(license)}
                                className="p-2 text-libro-warmgray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                title="Revoke"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-libro-warmgray-100">
                <p className="text-sm text-libro-warmgray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary py-2 px-3 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary py-2 px-3 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Generate Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-libro-warmgray-100">
              <h2 className="text-lg font-semibold text-libro-warmgray-800">Generate License</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Organization *
                </label>
                <select
                  value={formData.organization_id}
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Subscription Tier *
                </label>
                <select
                  value={formData.tier_id}
                  onChange={(e) => setFormData({ ...formData, tier_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select tier</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} - ${tier.price_annual}/year
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Max Activations
                  </label>
                  <input
                    type="number"
                    value={formData.max_activations}
                    onChange={(e) => setFormData({ ...formData, max_activations: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Internal notes..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
