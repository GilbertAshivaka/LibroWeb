import { useState, useEffect } from 'react'
import { paymentsAPI, organizationsAPI, tiersAPI } from '../../api'
import {
  CreditCard,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  DollarSign,
  Calendar,
  FileText,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [tiers, setTiers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [orgFilter, setOrgFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    organization_id: '',
    tier_id: '',
    amount: '',
    currency: 'USD',
    payment_method: 'bank_transfer',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    reference: '',
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    fetchOrganizations()
    fetchTiers()
  }, [])
  
  useEffect(() => {
    fetchPayments()
  }, [page, orgFilter])
  
  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      const response = await paymentsAPI.list({
        page,
        page_size: 10,
        organization_id: orgFilter || undefined,
      })
      setPayments(response.data.items || response.data)
      setTotalPages(response.data.pages || 1)
    } catch (error) {
      toast.error('Failed to load payments')
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
      amount: '',
      currency: 'USD',
      payment_method: 'bank_transfer',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      reference: '',
      notes: '',
    })
    setShowModal(true)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.organization_id || !formData.amount) {
      toast.error('Organization and amount are required')
      return
    }
    
    setIsSaving(true)
    
    try {
      await paymentsAPI.create({
        ...formData,
        organization_id: parseInt(formData.organization_id),
        tier_id: formData.tier_id ? parseInt(formData.tier_id) : null,
        amount: parseFloat(formData.amount),
      })
      toast.success('Payment recorded')
      setShowModal(false)
      fetchPayments()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record payment')
    } finally {
      setIsSaving(false)
    }
  }
  
  const getPaymentMethodLabel = (method) => {
    const labels = {
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      check: 'Check',
      card: 'Card',
      other: 'Other',
    }
    return labels[method] || method
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-libro-warmgray-800">Payments</h1>
          <p className="text-libro-warmgray-500">Record and track external payments</p>
        </div>
        <button onClick={openModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>
      
      {/* Filter */}
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
        </div>
      </div>
      
      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-libro-coral-500 border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-libro-warmgray-500">
            <CreditCard className="w-12 h-12 mb-3 text-libro-warmgray-300" />
            <p>No payments recorded</p>
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
                      Amount
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Method
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Reference
                    </th>
                    <th className="text-left text-xs font-medium text-libro-warmgray-500 uppercase tracking-wider px-6 py-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-libro-warmgray-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-libro-warmgray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-libro-coral-50 rounded-lg">
                            <Building2 className="w-4 h-4 text-libro-coral-500" />
                          </div>
                          <div>
                            <p className="font-medium text-libro-warmgray-800">
                              {payment.organization?.name || 'Unknown'}
                            </p>
                            {payment.tier && (
                              <p className="text-xs text-libro-warmgray-500">{payment.tier.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-libro-green-600 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {parseFloat(payment.amount).toFixed(2)} {payment.currency}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-600">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </td>
                      <td className="px-6 py-4">
                        {payment.reference ? (
                          <code className="text-xs bg-libro-warmgray-50 px-2 py-1 rounded">
                            {payment.reference}
                          </code>
                        ) : (
                          <span className="text-libro-warmgray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-libro-warmgray-600">
                        {format(new Date(payment.payment_date), 'MMM d, yyyy')}
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
          <div className="fixed inset-0 bg-black/20" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-libro-warmgray-100">
              <h2 className="text-lg font-semibold text-libro-warmgray-800">Record Payment</h2>
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
                  Subscription Tier
                </label>
                <select
                  value={formData.tier_id}
                  onChange={(e) => setFormData({ ...formData, tier_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select tier (optional)</option>
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
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="input"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Reference / Invoice #
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="input"
                  placeholder="INV-2024-001"
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
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
