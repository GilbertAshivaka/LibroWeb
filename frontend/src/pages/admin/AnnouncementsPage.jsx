import { useState, useEffect } from 'react'
import { announcementsAPI } from '../../api'
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Globe,
  Lock
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingAnn, setEditingAnn] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    is_active: true,
    is_public: true,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [preview, setPreview] = useState(null)
  
  useEffect(() => {
    fetchAnnouncements()
  }, [page])
  
  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const response = await announcementsAPI.list({
        page,
        page_size: 10,
      })
      setAnnouncements(response.data.items || response.data)
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      toast.error('Failed to load announcements')
    } finally {
      setIsLoading(false)
    }
  }
  
  const openModal = (ann = null) => {
    if (ann) {
      setEditingAnn(ann)
      setFormData({
        title: ann.title || '',
        content: ann.content || '',
        priority: ann.priority || 'normal',
        is_active: ann.is_active ?? true,
        is_public: ann.is_public ?? true,
        start_date: ann.start_date ? format(new Date(ann.start_date), 'yyyy-MM-dd') : '',
        end_date: ann.end_date ? format(new Date(ann.end_date), 'yyyy-MM-dd') : '',
      })
    } else {
      setEditingAnn(null)
      setFormData({
        title: '',
        content: '',
        priority: 'normal',
        is_active: true,
        is_public: true,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
      })
    }
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingAnn(null)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required')
      return
    }
    
    setIsSaving(true)
    
    try {
      const payload = {
        ...formData,
        end_date: formData.end_date || null,
      }
      
      if (editingAnn) {
        await announcementsAPI.update(editingAnn.id, payload)
        toast.success('Announcement updated')
      } else {
        await announcementsAPI.create(payload)
        toast.success('Announcement created')
      }
      closeModal()
      fetchAnnouncements()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save announcement')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = async (ann) => {
    if (!confirm(`Delete announcement "${ann.title}"?`)) return
    
    try {
      await announcementsAPI.delete(ann.id)
      toast.success('Announcement deleted')
      fetchAnnouncements()
    } catch (error) {
      toast.error('Failed to delete announcement')
    }
  }
  
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return <span className="badge badge-danger">Critical</span>
      case 'high':
        return <span className="badge badge-warning">High</span>
      case 'low':
        return <span className="badge text-libro-warmgray-500 bg-libro-warmgray-100">Low</span>
      default:
        return <span className="badge text-libro-blue-500 bg-libro-blue-50">Normal</span>
    }
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-libro-warmgray-800">Announcements</h1>
          <p className="text-libro-warmgray-500">Manage announcements for Libro users</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Announcement
        </button>
      </div>
      
      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-libro-coral-500 border-t-transparent" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-libro-warmgray-500">
            <Megaphone className="w-12 h-12 mb-3 text-libro-warmgray-300" />
            <p>No announcements yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-libro-warmgray-50 border-b border-libro-warmgray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Title
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Priority
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Visibility
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Date Range
                    </th>
                    <th className="text-right text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-libro-warmgray-100">
                  {announcements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-libro-warmgray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-libro-warmgray-800">{ann.title}</p>
                          <p className="text-sm text-libro-warmgray-500 line-clamp-1">
                            {ann.content?.replace(/<[^>]*>/g, '').substring(0, 60)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getPriorityBadge(ann.priority)}
                      </td>
                      <td className="px-6 py-4">
                        {ann.is_public ? (
                          <span className="inline-flex items-center gap-1 text-sm text-libro-green-500">
                            <Globe className="w-4 h-4" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-libro-warmgray-500">
                            <Lock className="w-4 h-4" /> Internal
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${ann.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {ann.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-500">
                        {ann.start_date && format(new Date(ann.start_date), 'MMM d, yyyy')}
                        {ann.end_date && ` - ${format(new Date(ann.end_date), 'MMM d, yyyy')}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreview(ann)}
                            className="p-2 text-libro-warmgray-400 hover:text-libro-blue-500 hover:bg-libro-blue-50 rounded-lg"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(ann)}
                            className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ann)}
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
      
      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-libro-warmgray-100">
              <h2 className="text-lg font-semibold text-libro-warmgray-800">
                {editingAnn ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={closeModal} className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Announcement title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Content (HTML) *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input font-mono text-sm"
                  rows={6}
                  placeholder="<p>Your announcement content...</p>"
                />
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input"
                    placeholder="No end date"
                  />
                </div>
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
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="w-4 h-4 text-libro-coral-500 rounded border-libro-warmgray-300 focus:ring-libro-coral-500"
                  />
                  <span className="text-sm text-libro-warmgray-700">Public</span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAnn ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20" onClick={() => setPreview(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-libro-warmgray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-libro-warmgray-800">{preview.title}</h2>
                {getPriorityBadge(preview.priority)}
              </div>
              <button onClick={() => setPreview(null)} className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div 
              className="p-6 prose prose-libro max-w-none"
              dangerouslySetInnerHTML={{ __html: preview.content }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
