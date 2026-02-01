import { useState, useEffect } from 'react'
import { tiersAPI } from '../../api'
import {
  Settings,
  Layers,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  DollarSign,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [tiers, setTiers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTier, setEditingTier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price_monthly: 0,
    price_annual: 0,
    max_users: 10,
    max_records: 10000,
    features: [],
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [newFeature, setNewFeature] = useState('')
  
  useEffect(() => {
    fetchTiers()
  }, [])
  
  const fetchTiers = async () => {
    try {
      setIsLoading(true)
      const response = await tiersAPI.list()
      setTiers(response.data)
    } catch (error) {
      toast.error('Failed to load tiers')
    } finally {
      setIsLoading(false)
    }
  }
  
  const openModal = (tier = null) => {
    if (tier) {
      setEditingTier(tier)
      setFormData({
        name: tier.name || '',
        code: tier.code || '',
        description: tier.description || '',
        price_monthly: tier.price_monthly || 0,
        price_annual: tier.price_annual || 0,
        max_users: tier.max_users || 10,
        max_records: tier.max_records || 10000,
        features: tier.features || [],
        is_active: tier.is_active ?? true,
      })
    } else {
      setEditingTier(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        price_monthly: 0,
        price_annual: 0,
        max_users: 10,
        max_records: 10000,
        features: [],
        is_active: true,
      })
    }
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingTier(null)
    setNewFeature('')
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required')
      return
    }
    
    setIsSaving(true)
    
    try {
      if (editingTier) {
        await tiersAPI.update(editingTier.id, formData)
        toast.success('Tier updated')
      } else {
        await tiersAPI.create(formData)
        toast.success('Tier created')
      }
      closeModal()
      fetchTiers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save tier')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = async (tier) => {
    if (!confirm(`Delete tier "${tier.name}"?`)) return
    
    try {
      await tiersAPI.delete(tier.id)
      toast.success('Tier deleted')
      fetchTiers()
    } catch (error) {
      toast.error('Failed to delete tier')
    }
  }
  
  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      })
      setNewFeature('')
    }
  }
  
  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    })
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-libro-warmgray-800">Settings</h1>
        <p className="text-libro-warmgray-500">Configure system settings</p>
      </div>
      
      {/* Subscription Tiers */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-libro-warmgray-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-libro-coral-500" />
            <h2 className="font-semibold text-libro-warmgray-800">Subscription Tiers</h2>
          </div>
          <button onClick={() => openModal()} className="btn-primary btn-sm text-sm py-1.5 px-3 flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Add Tier
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-libro-coral-500 border-t-transparent" />
          </div>
        ) : tiers.length === 0 ? (
          <div className="p-8 text-center text-libro-warmgray-500">
            <Layers className="w-10 h-10 mx-auto mb-2 text-libro-warmgray-300" />
            <p>No tiers configured</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {tiers.map((tier) => (
              <div 
                key={tier.id} 
                className={`rounded-xl border-2 p-5 ${
                  tier.is_active 
                    ? 'border-libro-coral-200 bg-libro-coral-50/50' 
                    : 'border-libro-warmgray-200 bg-libro-warmgray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-libro-warmgray-800">{tier.name}</h3>
                    <code className="text-xs text-libro-warmgray-500">{tier.code}</code>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(tier)}
                      className="p-1.5 text-libro-warmgray-400 hover:text-libro-coral-500 hover:bg-white rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tier)}
                      className="p-1.5 text-libro-warmgray-400 hover:text-red-500 hover:bg-white rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <p className="text-2xl font-bold text-libro-warmgray-800 mb-1">
                  ${tier.price_annual}<span className="text-sm font-normal text-libro-warmgray-500">/year</span>
                </p>
                <p className="text-sm text-libro-warmgray-500 mb-3">
                  or ${tier.price_monthly}/month
                </p>
                
                <div className="text-sm text-libro-warmgray-600 space-y-1 mb-3">
                  <p>Up to {tier.max_users?.toLocaleString()} users</p>
                  <p>Up to {tier.max_records?.toLocaleString()} records</p>
                </div>
                
                {tier.features?.length > 0 && (
                  <ul className="text-sm text-libro-warmgray-600 space-y-1">
                    {tier.features.slice(0, 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-libro-green-500" />
                        {feature}
                      </li>
                    ))}
                    {tier.features.length > 3 && (
                      <li className="text-libro-warmgray-400">
                        +{tier.features.length - 3} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-libro-warmgray-100">
              <h2 className="text-lg font-semibold text-libro-warmgray-800">
                {editingTier ? 'Edit Tier' : 'New Tier'}
              </h2>
              <button onClick={closeModal} className="p-2 text-libro-warmgray-400 hover:text-libro-warmgray-600 hover:bg-libro-warmgray-50 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Standard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    className="input font-mono"
                    placeholder="standard"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Best for small libraries..."
                />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Annual Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_annual}
                    onChange={(e) => setFormData({ ...formData, price_annual: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Max Users
                  </label>
                  <input
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Max Records
                  </label>
                  <input
                    type="number"
                    value={formData.max_records}
                    onChange={(e) => setFormData({ ...formData, max_records: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Features
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    className="input flex-1"
                    placeholder="Add a feature..."
                  />
                  <button type="button" onClick={addFeature} className="btn-secondary">
                    Add
                  </button>
                </div>
                {formData.features.length > 0 && (
                  <ul className="space-y-1">
                    {formData.features.map((feature, i) => (
                      <li key={i} className="flex items-center justify-between bg-libro-warmgray-50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-libro-warmgray-700">{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="text-libro-warmgray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
                  {editingTier ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
