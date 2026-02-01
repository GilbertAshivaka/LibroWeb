import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BookOpen, ArrowLeft, Loader2, Check, Building2, Mail, User, Phone, MapPin, Lock } from 'lucide-react'
import { publicAPI } from '../../api'
import toast from 'react-hot-toast'

const plans = {
  starter: { name: 'Starter', price: 299 },
  professional: { name: 'Professional', price: 799 },
  enterprise: { name: 'Enterprise', price: 1999 },
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedPlan = searchParams.get('plan') || 'professional'
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Organization
    organization_name: '',
    location: '',
    address: '',
    phone: '',
    // Contact
    contact_name: '',
    email: '',
    password: '',
    password_confirm: '',
    // Plan
    plan: selectedPlan,
    accept_terms: false,
  })
  const [result, setResult] = useState(null)
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  
  const validateStep1 = () => {
    if (!formData.organization_name) {
      toast.error('Organization name is required')
      return false
    }
    if (!formData.location) {
      toast.error('Location is required')
      return false
    }
    return true
  }
  
  const validateStep2 = () => {
    if (!formData.contact_name) {
      toast.error('Contact name is required')
      return false
    }
    if (!formData.email) {
      toast.error('Email is required')
      return false
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match')
      return false
    }
    return true
  }
  
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.accept_terms) {
      toast.error('Please accept the terms and conditions')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await publicAPI.register({
        organization_name: formData.organization_name,
        location: formData.location,
        address: formData.address,
        phone: formData.phone,
        full_name: formData.contact_name,
        email: formData.email,
        password: formData.password,
        plan: formData.plan,
      })
      
      setResult(response.data)
      setStep(4)
      toast.success('Registration successful!')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }
  
  return (
    <div className="min-h-screen bg-libro-cream-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-libro-coral-500 to-libro-coral-600 p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold">Libro</span>
        </Link>
        
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Start Your Free 30-Day Trial
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Get full access to Libro ILMS with no credit card required.
          </p>
          
          <div className="space-y-4">
            {['Full catalog management', 'Circulation & fines', 'Reports & analytics', 'AI-powered assistance'].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-white/90">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-white/60 text-sm">
          © {new Date().getFullYear()} Libro ILMS. All rights reserved.
        </p>
      </div>
      
      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-libro-warmgray-600 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          
          {/* Progress Steps */}
          {step < 4 && (
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    s < step 
                      ? 'bg-libro-green-500 text-white' 
                      : s === step 
                      ? 'bg-libro-coral-500 text-white'
                      : 'bg-libro-warmgray-200 text-libro-warmgray-500'
                  }`}>
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 h-1 mx-1 rounded ${
                      s < step ? 'bg-libro-green-500' : 'bg-libro-warmgray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Step 1: Organization */}
          {step === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-libro-warmgray-800 mb-2">
                Organization Details
              </h2>
              <p className="text-libro-warmgray-500 mb-6">
                Tell us about your library
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                    <input
                      type="text"
                      name="organization_name"
                      value={formData.organization_name}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Springfield Public Library"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="Springfield, IL, USA"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input"
                    rows={2}
                    placeholder="123 Main Street..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
              
              <button onClick={handleNext} className="btn-primary w-full mt-6">
                Continue
              </button>
            </div>
          )}
          
          {/* Step 2: Account */}
          {step === 2 && (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-libro-warmgray-800 mb-2">
                Create Your Account
              </h2>
              <p className="text-libro-warmgray-500 mb-6">
                Set up your admin credentials
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Your Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                    <input
                      type="text"
                      name="contact_name"
                      value={formData.contact_name}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="John Smith"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="you@library.org"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-libro-warmgray-500 mt-1">
                    At least 8 characters
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                    <input
                      type="password"
                      name="password_confirm"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className="input pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Back
                </button>
                <button onClick={handleNext} className="btn-primary flex-1">
                  Continue
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Plan & Confirm */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="animate-fadeIn">
              <h2 className="text-2xl font-bold text-libro-warmgray-800 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-libro-warmgray-500 mb-6">
                Start with a 30-day free trial
              </p>
              
              <div className="space-y-3 mb-6">
                {Object.entries(plans).map(([key, plan]) => (
                  <label 
                    key={key}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.plan === key 
                        ? 'border-libro-coral-500 bg-libro-coral-50' 
                        : 'border-libro-warmgray-200 hover:border-libro-warmgray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="plan"
                        value={key}
                        checked={formData.plan === key}
                        onChange={handleChange}
                        className="w-4 h-4 text-libro-coral-500"
                      />
                      <div>
                        <p className="font-medium text-libro-warmgray-800">{plan.name}</p>
                        <p className="text-sm text-libro-warmgray-500">30-day free trial</p>
                      </div>
                    </div>
                    <p className="font-semibold text-libro-warmgray-800">
                      ${plan.price}<span className="text-sm font-normal text-libro-warmgray-500">/year</span>
                    </p>
                  </label>
                ))}
              </div>
              
              <div className="bg-libro-warmgray-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-libro-warmgray-800 mb-2">Summary</h3>
                <div className="text-sm space-y-1 text-libro-warmgray-600">
                  <p><strong>Organization:</strong> {formData.organization_name}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Plan:</strong> {plans[formData.plan]?.name} (30-day trial)</p>
                </div>
              </div>
              
              <label className="flex items-start gap-2 mb-6">
                <input
                  type="checkbox"
                  name="accept_terms"
                  checked={formData.accept_terms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 text-libro-coral-500 rounded"
                />
                <span className="text-sm text-libro-warmgray-600">
                  I agree to the <a href="#" className="text-libro-coral-500 hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="text-libro-coral-500 hover:underline">Privacy Policy</a>
                </span>
              </label>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                  Back
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Start Free Trial
                </button>
              </div>
            </form>
          )}
          
          {/* Step 4: Success */}
          {step === 4 && result && (
            <div className="animate-fadeIn text-center">
              <div className="w-16 h-16 bg-libro-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-libro-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-libro-warmgray-800 mb-2">
                Registration Complete!
              </h2>
              <p className="text-libro-warmgray-500 mb-8">
                Your 30-day trial has started. Save your credentials below.
              </p>
              
              <div className="bg-libro-warmgray-50 rounded-xl p-6 text-left space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-libro-warmgray-500 mb-1">
                    ORGANIZATION ID
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-libro-warmgray-800 font-mono text-sm border border-libro-warmgray-200">
                      {result.organization_id}
                    </code>
                    <button
                      onClick={() => copyToClipboard(result.organization_id, 'Organization ID')}
                      className="btn-secondary py-2 px-3"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-libro-warmgray-500 mb-1">
                    LICENSE KEY
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-libro-warmgray-800 font-mono text-sm border border-libro-warmgray-200 break-all">
                      {result.license_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(result.license_key, 'License Key')}
                      className="btn-secondary py-2 px-3"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-libro-warmgray-200">
                  <p className="text-sm text-libro-warmgray-600">
                    <strong>Email:</strong> {result.email}
                  </p>
                  <p className="text-sm text-libro-warmgray-600">
                    <strong>{result.is_trial ? 'Trial' : 'License'} Expires:</strong> {new Date(result.license_expiry).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-libro-blue-50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-libro-blue-700">
                  <strong>Next Steps:</strong><br />
                  1. Download the Libro app from the <Link to="/download" className="underline">downloads page</Link><br />
                  2. Enter your Organization ID and License Key during setup<br />
                  3. Start managing your library!
                </p>
              </div>
              
              <div className="flex gap-3">
                <Link to="/download" className="btn-secondary flex-1">
                  Download App
                </Link>
                <Link to="/portal/login" className="btn-primary flex-1">
                  Go to Portal
                </Link>
              </div>
            </div>
          )}
          
          {step < 4 && (
            <p className="text-center text-sm text-libro-warmgray-500 mt-6">
              Already have an account?{' '}
              <Link to="/portal/login" className="text-libro-coral-500 hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
