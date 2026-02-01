import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { portalAPI } from '../../api'
import usePortalStore from '../../store/portalStore'
import toast from 'react-hot-toast'

export default function PortalLoginPage() {
  const navigate = useNavigate()
  const { login } = usePortalStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await login(email, password)
      if (result.success) {
        toast.success('Welcome back!')
        navigate('/portal')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-libro-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 text-libro-warmgray-500 hover:text-libro-warmgray-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-libro-coral-400 to-libro-coral-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-libro-warmgray-800">Customer Portal</h1>
            <p className="text-libro-warmgray-500">Sign in to manage your subscription</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@library.org"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-libro-warmgray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-libro-warmgray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <a href="#" className="text-libro-coral-500 hover:underline">
              Forgot password?
            </a>
          </div>
          
          <div className="mt-6 pt-6 border-t border-libro-warmgray-100 text-center text-sm text-libro-warmgray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-libro-coral-500 hover:underline">
              Start free trial
            </Link>
          </div>
        </div>
        
        <p className="text-center text-sm text-libro-warmgray-500 mt-6">
          Admin user?{' '}
          <Link to="/login" className="text-libro-coral-500 hover:underline">
            Go to Admin Portal
          </Link>
        </p>
      </div>
    </div>
  )
}
