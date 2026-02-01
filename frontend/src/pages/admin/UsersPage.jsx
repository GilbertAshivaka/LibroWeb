import { useState, useEffect } from 'react'
import { usersAPI } from '../../api'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Shield,
  ShieldCheck,
  Mail
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

export default function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer',
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    fetchUsers()
  }, [page])
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await usersAPI.list({ page, page_size: 10 })
      setUsers(response.data.items || response.data)
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }
  
  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email || '',
        password: '',
        full_name: user.full_name || '',
        role: user.role || 'viewer',
        is_active: user.is_active ?? true,
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'viewer',
        is_active: true,
      })
    }
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingUser(null)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error('Email is required')
      return
    }
    
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users')
      return
    }
    
    setIsSaving(true)
    
    try {
      const payload = { ...formData }
      if (!payload.password) {
        delete payload.password
      }
      
      if (editingUser) {
        await usersAPI.update(editingUser.id, payload)
        toast.success('User updated')
      } else {
        await usersAPI.create(payload)
        toast.success('User created')
      }
      closeModal()
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save user')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account")
      return
    }
    
    if (!confirm(`Delete user "${user.email}"?`)) return
    
    try {
      await usersAPI.delete(user.id)
      toast.success('User deleted')
      fetchUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }
  
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 badge badge-danger">
            <ShieldCheck className="w-3 h-3" /> Super Admin
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 badge badge-warning">
            <Shield className="w-3 h-3" /> Admin
          </span>
        )
      default:
        return (
          <span className="badge text-libro-warmgray-500 bg-libro-warmgray-100">
            Viewer
          </span>
        )
    }
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-libro-warmgray-800">Admin Users</h1>
          <p className="text-libro-warmgray-500">Manage portal access</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>
      
      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-libro-coral-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-libro-warmgray-500">
            <Users className="w-12 h-12 mb-3 text-libro-warmgray-300" />
            <p>No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-libro-warmgray-50 border-b border-libro-warmgray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Role
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Last Login
                    </th>
                    <th className="text-right text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-libro-warmgray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-libro-warmgray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-libro-coral-50 rounded-full flex items-center justify-center">
                            <span className="text-libro-coral-500 font-semibold">
                              {(user.full_name || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-libro-warmgray-800">
                              {user.full_name || 'No name'}
                            </p>
                            <p className="text-sm text-libro-warmgray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-500">
                        {user.last_login 
                          ? format(new Date(user.last_login), 'MMM d, yyyy HH:mm')
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openModal(user)}
                            className="p-2 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-libro-coral-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 text-libro-warmgray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-libro-warmgray-100">
              <h2 className="text-lg font-semibold text-libro-warmgray-800">
                {editingUser ? 'Edit User' : 'New User'}
              </h2>
              <button onClick={closeModal} className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input"
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-libro-coral-500 rounded border-libro-warmgray-300 focus:ring-libro-coral-500"
                />
                <span className="text-sm text-libro-warmgray-700">Active</span>
              </label>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
