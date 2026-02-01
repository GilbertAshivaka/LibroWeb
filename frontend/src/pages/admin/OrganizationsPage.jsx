import { useState, useEffect } from 'react'
import { organizationsAPI } from '../../api'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Building2, 
  Mail, 
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    contact_person: '',
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    fetchOrganizations()
  }, [page, search])
  
  const fetchOrganizations = async () => {
    try {
      setIsLoading(true)
      const response = await organizationsAPI.list({
        page,
        page_size: 10,
        search: search || undefined,
      })
      setOrganizations(response.data.items)
      setTotalPages(response.data.pages)
    } catch (error) {
      toast.error('Failed to load organizations')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchOrganizations()
  }
  
  const openModal = (org = null) => {
    if (org) {
      setEditingOrg(org)
      setFormData({
        name: org.name || '',
        location: org.location || '',
        address: org.address || '',
        phone: org.phone || '',
        email: org.email || '',
        contact_person: org.contact_person || '',
        notes: org.notes || '',
      })
    } else {
      setEditingOrg(null)
      setFormData({
        name: '',
        location: '',
        address: '',
        phone: '',
        email: '',
        contact_person: '',
        notes: '',
      })
    }
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingOrg(null)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Organization name is required')
      return
    }
    
    setIsSaving(true)
    
    try {
      if (editingOrg) {
        await organizationsAPI.update(editingOrg.id, formData)
        toast.success('Organization updated')
      } else {
        await organizationsAPI.create(formData)
        toast.success('Organization created')
      }
      closeModal()
      fetchOrganizations()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save organization')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = async (org) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This will also delete all associated licenses.`)) {
      return
    }
    
    try {
      await organizationsAPI.delete(org.id)
      toast.success('Organization deleted')
      fetchOrganizations()
    } catch (error) {
      toast.error('Failed to delete organization')
    }
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-libro-warmgray-800">Organizations</h1>
          <p className="text-libro-warmgray-500">Manage library customers</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Organization
        </button>
      </div>
      
      {/* Search */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="input pl-10"
            />
          </div>
          <button type="submit" className="btn-secondary">
            Search
          </button>
        </form>
      </div>
      
      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-libro-coral-500 border-t-transparent" />
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-libro-warmgray-500">
            <Building2 className="w-12 h-12 mb-3 text-libro-warmgray-300" />
            <p>No organizations found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-libro-warmgray-50 border-b border-libro-warmgray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Organization
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Contact
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Created
                    </th>
                    <th className="text-right text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-libro-warmgray-100">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-libro-warmgray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-libro-coral-50 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-libro-coral-500" />
                          </div>
                          <div>
                            <Link 
                              to={`/admin/organizations/${org.id}`}
                              className="font-medium text-libro-warmgray-800 hover:text-libro-coral-500"
                            >
                              {org.name}
                            </Link>
                            <p className="text-sm text-libro-warmgray-500">{org.organization_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {org.email && (
                            <p className="text-sm text-libro-warmgray-600 flex items-center gap-1">
                              <Mail className="w-4 h-4 text-libro-warmgray-400" />
                              {org.email}
                            </p>
                          )}
                          {org.location && (
                            <p className="text-sm text-libro-warmgray-500 flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-libro-warmgray-400" />
                              {org.location}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${org.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-500">
                        {format(new Date(org.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/organizations/${org.id}`}
                            className="p-2 text-libro-warmgray-400 hover:text-libro-blue-500 hover:bg-libro-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openModal(org)}
                            className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(org)}
                            className="p-2 text-libro-warmgray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-libro-warmgray-100">
              <h2 className="text-lg font-semibold text-libro-warmgray-800">
                {editingOrg ? 'Edit Organization' : 'New Organization'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Springfield Public Library"
                />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                    placeholder="Springfield, IL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="library@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="input"
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="123 Main Street..."
                />
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
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingOrg ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
