import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { organizationsAPI, licensesAPI } from '../../api'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Key,
  ArrowLeft,
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function OrganizationDetailPage() {
  const { id } = useParams()
  const [organization, setOrganization] = useState(null)
  const [licenses, setLicenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
  }, [id])
  
  const fetchData = async () => {
    try {
      const [orgRes, licRes] = await Promise.all([
        organizationsAPI.get(id),
        licensesAPI.list({ organization_id: id, page_size: 100 }),
      ])
      setOrganization(orgRes.data)
      setLicenses(licRes.data.items)
    } catch (error) {
      toast.error('Failed to load organization')
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
  
  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-libro-warmgray-500">Organization not found</p>
        <Link to="/admin/organizations" className="btn-primary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Organizations
        </Link>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/organizations"
            className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-libro-warmgray-800">{organization.name}</h1>
            <p className="text-libro-warmgray-500">{organization.organization_id}</p>
          </div>
        </div>
        <span className={`badge ${organization.is_active ? 'badge-success' : 'badge-danger'}`}>
          {organization.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      {/* Info Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold text-libro-warmgray-800 mb-4">Contact Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {organization.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-libro-coral-50 rounded-lg">
                  <Mail className="w-5 h-5 text-libro-coral-500" />
                </div>
                <div>
                  <p className="text-xs text-libro-warmgray-500">Email</p>
                  <p className="text-sm text-libro-warmgray-800">{organization.email}</p>
                </div>
              </div>
            )}
            {organization.phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-libro-blue-50 rounded-lg">
                  <Phone className="w-5 h-5 text-libro-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-libro-warmgray-500">Phone</p>
                  <p className="text-sm text-libro-warmgray-800">{organization.phone}</p>
                </div>
              </div>
            )}
            {organization.location && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-libro-green-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-libro-green-500" />
                </div>
                <div>
                  <p className="text-xs text-libro-warmgray-500">Location</p>
                  <p className="text-sm text-libro-warmgray-800">{organization.location}</p>
                </div>
              </div>
            )}
            {organization.contact_person && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-libro-amber-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-libro-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-libro-warmgray-500">Contact Person</p>
                  <p className="text-sm text-libro-warmgray-800">{organization.contact_person}</p>
                </div>
              </div>
            )}
          </div>
          
          {organization.address && (
            <div className="mt-4 pt-4 border-t border-libro-warmgray-100">
              <p className="text-xs text-libro-warmgray-500 mb-1">Address</p>
              <p className="text-sm text-libro-warmgray-800">{organization.address}</p>
            </div>
          )}
          
          {organization.notes && (
            <div className="mt-4 pt-4 border-t border-libro-warmgray-100">
              <p className="text-xs text-libro-warmgray-500 mb-1">Notes</p>
              <p className="text-sm text-libro-warmgray-600">{organization.notes}</p>
            </div>
          )}
        </div>
        
        {/* Stats */}
        <div className="card p-6">
          <h2 className="font-semibold text-libro-warmgray-800 mb-4">Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-libro-warmgray-500">Total Licenses</span>
              <span className="font-semibold text-libro-warmgray-800">{licenses.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-libro-warmgray-500">Active Licenses</span>
              <span className="font-semibold text-libro-green-500">
                {licenses.filter(l => l.is_active && !l.is_revoked).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-libro-warmgray-500">Created</span>
              <span className="text-sm text-libro-warmgray-800">
                {format(new Date(organization.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Licenses */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-libro-warmgray-100">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-libro-coral-500" />
            <h2 className="font-semibold text-libro-warmgray-800">Licenses</h2>
          </div>
          <Link
            to={`/admin/licenses?organization=${id}`}
            className="btn-primary btn-sm flex items-center gap-1 text-sm py-1.5 px-3"
          >
            <Plus className="w-4 h-4" />
            Generate License
          </Link>
        </div>
        
        {licenses.length === 0 ? (
          <div className="p-8 text-center text-libro-warmgray-500">
            <Key className="w-10 h-10 mx-auto mb-2 text-libro-warmgray-300" />
            <p>No licenses yet</p>
          </div>
        ) : (
          <div className="divide-y divide-libro-warmgray-100">
            {licenses.map((license) => (
              <div key={license.id} className="flex items-center gap-4 p-4 hover:bg-libro-warmgray-50">
                <div className={`p-2 rounded-full ${
                  license.is_revoked
                    ? 'bg-red-50 text-red-500'
                    : license.is_active
                    ? 'bg-libro-green-50 text-libro-green-500'
                    : 'bg-libro-warmgray-100 text-libro-warmgray-400'
                }`}>
                  {license.is_revoked ? (
                    <XCircle className="w-5 h-5" />
                  ) : license.is_active ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm text-libro-warmgray-800">{license.license_key}</p>
                  <p className="text-xs text-libro-warmgray-500">
                    Expires: {format(new Date(license.expiry_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <span className={`badge ${
                  license.is_revoked
                    ? 'badge-danger'
                    : license.is_active
                    ? 'badge-success'
                    : 'badge-warning'
                }`}>
                  {license.is_revoked ? 'Revoked' : license.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
