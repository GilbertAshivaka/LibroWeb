import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import usePortalStore from '../../store/portalStore'
import { portalAPI, publicAPI } from '../../api'
import {
  BookOpen,
  ArrowLeft,
  Check,
  CreditCard,
  Building2,
  Users,
  Sparkles,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function PortalBillingPage() {
  const navigate = useNavigate()
  const { customer, organization, license, fetchCustomerData } = usePortalStore()
  const [plans, setPlans] = useState([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'bank_transfer',
    reference: ''
  })
  
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await publicAPI.getTiers()
        const data = res.data?.tiers || res.data || []
        setPlans(data.filter(t => t.code !== 'trial').map(t => ({
          id: t.code,
          name: t.name,
          price: t.price_yearly,
          description: t.description,
          features: Array.isArray(t.features) ? t.features : [],
        })))
      } catch {
        setPlans([])
      } finally {
        setIsLoadingPlans(false)
      }
    }
    fetchTiers()
  }, [])
  
  useEffect(() => {
    if (license?.tier) {
      setSelectedPlan(license.tier.name?.toLowerCase())
    }
  }, [license])
  
  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId)
    setShowPaymentForm(true)
  }
  
  const handlePayment = async () => {
    if (!paymentDetails.reference) {
      toast.error('Please enter payment reference')
      return
    }
    
    setIsLoading(true)
    
    try {
      // In a real app, this would process the payment
      // For now, we'll record it as pending
      await portalAPI.recordPayment({
        plan: selectedPlan,
        payment_method: paymentDetails.method,
        reference: paymentDetails.reference,
        amount: plans.find(p => p.id === selectedPlan)?.price || 0
      })
      
      toast.success('Payment submitted! We will verify and activate your license within 24 hours.')
      setShowPaymentForm(false)
      await fetchCustomerData()
    } catch (error) {
      toast.error('Failed to submit payment')
    } finally {
      setIsLoading(false)
    }
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
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/portal" 
          className="flex items-center gap-2 text-libro-warmgray-500 hover:text-libro-warmgray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-libro-warmgray-800">Subscription & Billing</h1>
          <p className="text-libro-warmgray-500">Choose a plan or manage your subscription</p>
        </div>
        
        {/* Current Plan */}
        {license && (
          <div className="card p-6 mb-8">
            <h2 className="font-semibold text-libro-warmgray-800 mb-4">Current Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-libro-warmgray-800">
                  {license.tier?.name || 'Trial'} Plan
                </p>
                <p className="text-libro-warmgray-500">
                  {license.is_trial ? 'Trial Period' : 'Active Subscription'}
                </p>
              </div>
              {license.is_trial && (
                <span className="px-3 py-1 bg-libro-amber-100 text-libro-amber-700 rounded-full text-sm font-medium">
                  Trial
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Pricing Plans */}
        {!showPaymentForm ? (
          isLoadingPlans ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-libro-coral-500 animate-spin" />
            </div>
          ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={plan.id}
                className={`card p-6 relative ${
                  index === plans.length - 1 ? 'ring-2 ring-libro-coral-500' : ''
                }`}
              >
                {index === plans.length - 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-libro-coral-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-bold text-libro-warmgray-800">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-libro-warmgray-800">${plan.price}</span>
                    <span className="text-libro-warmgray-500">/year</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-libro-warmgray-600">
                      <Check className="w-4 h-4 text-libro-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-2.5 rounded-xl font-medium transition-colors ${
                    index === plans.length - 1
                      ? 'bg-libro-coral-500 text-white hover:bg-libro-coral-600'
                      : 'bg-libro-warmgray-100 text-libro-warmgray-700 hover:bg-libro-warmgray-200'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
          )
        ) : (
          /* Payment Form */
          <div className="card p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-libro-warmgray-800 mb-6">
              Complete Your Purchase
            </h2>
            
            <div className="bg-libro-warmgray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-libro-warmgray-800">
                    {plans.find(p => p.id === selectedPlan)?.name} Plan
                  </p>
                  <p className="text-sm text-libro-warmgray-500">Annual subscription</p>
                </div>
                <p className="text-2xl font-bold text-libro-warmgray-800">
                  ${plans.find(p => p.id === selectedPlan)?.price}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({...paymentDetails, method: 'bank_transfer'})}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      paymentDetails.method === 'bank_transfer'
                        ? 'border-libro-coral-500 bg-libro-coral-50'
                        : 'border-libro-warmgray-200 hover:border-libro-warmgray-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-libro-warmgray-600 mb-1" />
                    <p className="font-medium text-libro-warmgray-800 text-sm">Bank Transfer</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({...paymentDetails, method: 'mobile_money'})}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      paymentDetails.method === 'mobile_money'
                        ? 'border-libro-coral-500 bg-libro-coral-50'
                        : 'border-libro-warmgray-200 hover:border-libro-warmgray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-libro-warmgray-600 mb-1" />
                    <p className="font-medium text-libro-warmgray-800 text-sm">Mobile Money</p>
                  </button>
                </div>
              </div>
              
              {paymentDetails.method === 'bank_transfer' && (
                <div className="bg-libro-blue-50 rounded-xl p-4">
                  <p className="font-medium text-libro-blue-800 mb-2">Bank Details</p>
                  <div className="text-sm text-libro-blue-700 space-y-1">
                    <p><strong>Bank:</strong> Example Bank</p>
                    <p><strong>Account Name:</strong> Libro Software Ltd</p>
                    <p><strong>Account Number:</strong> 1234567890</p>
                    <p><strong>Branch:</strong> Main Branch</p>
                    <p><strong>Reference:</strong> ORG-{organization?.organization_id?.slice(0, 8)}</p>
                  </div>
                </div>
              )}
              
              {paymentDetails.method === 'mobile_money' && (
                <div className="bg-libro-green-50 rounded-xl p-4">
                  <p className="font-medium text-libro-green-800 mb-2">Mobile Money Details</p>
                  <div className="text-sm text-libro-green-700 space-y-1">
                    <p><strong>Provider:</strong> MTN/Airtel</p>
                    <p><strong>Number:</strong> +256 700 123456</p>
                    <p><strong>Name:</strong> Libro Software Ltd</p>
                    <p><strong>Reference:</strong> ORG-{organization?.organization_id?.slice(0, 8)}</p>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                  Payment Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentDetails.reference}
                  onChange={(e) => setPaymentDetails({...paymentDetails, reference: e.target.value})}
                  className="input"
                  placeholder="Enter your payment reference"
                />
                <p className="text-xs text-libro-warmgray-500 mt-1">
                  Enter the transaction ID or reference number from your payment
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-libro-warmgray-100 text-libro-warmgray-700 hover:bg-libro-warmgray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment History */}
        <div className="mt-8 card p-6">
          <h2 className="font-semibold text-libro-warmgray-800 mb-4">Payment History</h2>
          <div className="text-center py-8 text-libro-warmgray-500">
            <CreditCard className="w-10 h-10 mx-auto mb-2 text-libro-warmgray-300" />
            <p>No payment history yet</p>
          </div>
        </div>
      </main>
    </div>
  )
}
