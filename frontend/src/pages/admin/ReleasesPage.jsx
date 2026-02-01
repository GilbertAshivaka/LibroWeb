import { useState, useEffect } from 'react'
import { releasesAPI } from '../../api'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Upload,
  HardDrive,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingRelease, setEditingRelease] = useState(null)
  const [formData, setFormData] = useState({
    version: '',
    release_notes: '',
    file_path: '',
    file_name: '',
    file_size: 0,
    sha256_checksum: '',
    is_active: true,
    is_latest: false,
    min_os_version: '',
    platform: 'windows',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    fetchReleases()
  }, [page])
  
  const fetchReleases = async () => {
    try {
      setIsLoading(true)
      const response = await releasesAPI.list({ page, page_size: 10 })
      setReleases(response.data.items || response.data)
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      toast.error('Failed to load releases')
    } finally {
      setIsLoading(false)
    }
  }
  
  const openModal = (release = null) => {
    if (release) {
      setEditingRelease(release)
      setFormData({
        version: release.version || '',
        release_notes: release.release_notes || '',
        file_path: release.file_path || '',
        file_name: release.file_name || '',
        file_size: release.file_size || 0,
        sha256_checksum: release.sha256_checksum || '',
        is_active: release.is_active ?? true,
        is_latest: release.is_latest ?? false,
        min_os_version: release.min_os_version || '',
        platform: release.platform || 'windows',
      })
    } else {
      setEditingRelease(null)
      setFormData({
        version: '',
        release_notes: '',
        file_path: '',
        file_name: '',
        file_size: 0,
        sha256_checksum: '',
        is_active: true,
        is_latest: false,
        min_os_version: '',
        platform: 'windows',
      })
    }
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingRelease(null)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.version || !formData.file_path) {
      toast.error('Version and file path are required')
      return
    }
    
    setIsSaving(true)
    
    try {
      if (editingRelease) {
        await releasesAPI.update(editingRelease.id, formData)
        toast.success('Release updated')
      } else {
        await releasesAPI.create(formData)
        toast.success('Release created')
      }
      closeModal()
      fetchReleases()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save release')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = async (release) => {
    if (!confirm(`Delete release ${release.version}?`)) return
    
    try {
      await releasesAPI.delete(release.id)
      toast.success('Release deleted')
      fetchReleases()
    } catch (error) {
      toast.error('Failed to delete release')
    }
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-libro-warmgray-800">App Releases</h1>
          <p className="text-libro-warmgray-500">Manage Libro installer downloads</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Release
        </button>
      </div>
      
      {/* Info Card */}
      <div className="card p-4 bg-libro-blue-50 border-libro-blue-100">
        <p className="text-sm text-libro-blue-700">
          <strong>Note:</strong> Upload installer files to the server's <code className="bg-libro-blue-100 px-1.5 py-0.5 rounded">/downloads</code> directory 
          and register them here. Files should be named like <code className="bg-libro-blue-100 px-1.5 py-0.5 rounded">libro-setup-1.0.0.exe</code>.
        </p>
      </div>
      
      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-libro-coral-500 border-t-transparent" />
          </div>
        ) : releases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-libro-warmgray-500">
            <Package className="w-12 h-12 mb-3 text-libro-warmgray-300" />
            <p>No releases yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-libro-warmgray-50 border-b border-libro-warmgray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Version
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Platform
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      File
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Downloads
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
                  {releases.map((release) => (
                    <tr key={release.id} className="hover:bg-libro-warmgray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-libro-warmgray-800">v{release.version}</span>
                          {release.is_latest && (
                            <span className="badge badge-success text-xs">Latest</span>
                          )}
                        </div>
                        <p className="text-xs text-libro-warmgray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(release.created_at), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-600 capitalize">
                        {release.platform || 'Windows'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-libro-warmgray-800">{release.file_name}</p>
                        <p className="text-xs text-libro-warmgray-500 flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatBytes(release.file_size)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-libro-warmgray-600">
                          <Download className="w-4 h-4" />
                          {release.download_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${release.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {release.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(release)}
                            className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(release)}
                            className="p-2 text-libro-warmgray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
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
                {editingRelease ? 'Edit Release' : 'New Release'}
              </h2>
              <button onClick={closeModal} className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="input"
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="input"
                  >
                    <option value="windows">Windows</option>
                    <option value="macos">macOS</option>
                    <option value="linux">Linux</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  File Path (on server) *
                </label>
                <input
                  type="text"
                  value={formData.file_path}
                  onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                  className="input font-mono text-sm"
                  placeholder="/downloads/libro-setup-1.0.0.exe"
                />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={formData.file_name}
                    onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                    className="input"
                    placeholder="libro-setup-1.0.0.exe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    File Size (bytes)
                  </label>
                  <input
                    type="number"
                    value={formData.file_size}
                    onChange={(e) => setFormData({ ...formData, file_size: parseInt(e.target.value) || 0 })}
                    className="input"
                    placeholder="3000000000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  SHA256 Checksum
                </label>
                <input
                  type="text"
                  value={formData.sha256_checksum}
                  onChange={(e) => setFormData({ ...formData, sha256_checksum: e.target.value })}
                  className="input font-mono text-sm"
                  placeholder="sha256 hash..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Min OS Version
                </label>
                <input
                  type="text"
                  value={formData.min_os_version}
                  onChange={(e) => setFormData({ ...formData, min_os_version: e.target.value })}
                  className="input"
                  placeholder="Windows 10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Release Notes
                </label>
                <textarea
                  value={formData.release_notes}
                  onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="What's new in this version..."
                />
              </div>
              
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-libro-coral-500 rounded border-libro-warmgray-300 focus:ring-libro-coral-500"
                  />
                  <span className="text-sm text-libro-warmgray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_latest}
                    onChange={(e) => setFormData({ ...formData, is_latest: e.target.checked })}
                    className="w-4 h-4 text-libro-coral-500 rounded border-libro-warmgray-300 focus:ring-libro-coral-500"
                  />
                  <span className="text-sm text-libro-warmgray-700">Mark as Latest</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRelease ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
