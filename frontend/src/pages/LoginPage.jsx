import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error('Please enter username and password')
      return
    }
    
    setIsLoading(true)
    
    const result = await login(username, password)
    
    setIsLoading(false)
    
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/admin')
    } else {
      toast.error(result.error)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-libro-cream-50 via-white to-libro-coral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-libro-coral-500 rounded-2xl shadow-warm mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-libro-warmgray-800">Libro Admin</h1>
          <p className="text-libro-warmgray-500 mt-1">Sign in to your account</p>
        </div>
        
        {/* Login Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-libro-warmgray-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-libro-warmgray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-libro-warmgray-400 hover:text-libro-warmgray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <p className="text-center text-sm text-libro-warmgray-500 mt-6">
          Libro Integrated Library Management System
        </p>
      </div>
    </div>
  )
}
