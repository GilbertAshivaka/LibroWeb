import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../api'
import { 
  BookOpen, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Cloud,
  Check,
  ArrowRight,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Complete Cataloging',
    description: 'MARC21 support, Z39.50 copy cataloging, and batch imports for efficient record management.',
  },
  {
    icon: Users,
    title: 'Patron Management',
    description: 'Member registration, circulation history, fines management, and self-service portal.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Reports',
    description: 'Collection analytics, circulation statistics, and customizable report builder.',
  },
  {
    icon: Zap,
    title: 'Fast & Modern',
    description: 'Built with Qt for native performance. Works offline with automatic sync.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Role-based access control, encrypted data, and automatic backups.',
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description: 'Optional cloud sync for multi-branch libraries and remote access.',
  },
]

export default function HomePage() {
  const [tiers, setTiers] = useState([])
  const [isLoadingTiers, setIsLoadingTiers] = useState(true)
  
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await publicAPI.getTiers()
        // Filter out trial tier for pricing display
        setTiers(response.data.filter(t => t.code !== 'trial'))
      } catch (error) {
        console.error('Failed to load tiers')
      } finally {
        setIsLoadingTiers(false)
      }
    }
    fetchTiers()
  }, [])
  return (
    <div className="min-h-screen bg-libro-cream-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-libro-warmgray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-libro-coral-400 to-libro-coral-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-libro-warmgray-800">Libro</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-libro-warmgray-600 hover:text-libro-coral-500 transition-colors">Features</a>
              <a href="#pricing" className="text-libro-warmgray-600 hover:text-libro-coral-500 transition-colors">Pricing</a>
              <Link to="/download" className="text-libro-warmgray-600 hover:text-libro-coral-500 transition-colors">Download</Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to="/portal/login" className="text-libro-warmgray-600 hover:text-libro-coral-500 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-libro-coral-50 text-libro-coral-600 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Now with AI-powered assistance
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-libro-warmgray-800 mb-6">
            Modern Library Management<br />
            <span className="text-libro-coral-500">Made Simple</span>
          </h1>
          
          <p className="text-xl text-libro-warmgray-600 max-w-2xl mx-auto mb-10">
            Libro ILMS is a powerful, easy-to-use integrated library management system 
            designed for libraries of all sizes. Cataloging, circulation, and more.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              Start 7-Day Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/download" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download App
            </Link>
          </div>
          
          <p className="text-sm text-libro-warmgray-500 mt-4">
            No credit card required • Full access for 7 days
          </p>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-libro-warmgray-800 mb-4">
              Everything You Need to Run Your Library
            </h2>
            <p className="text-lg text-libro-warmgray-600 max-w-2xl mx-auto">
              From cataloging to circulation, Libro has all the tools your library needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl bg-libro-cream-50 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-libro-coral-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-libro-coral-500" />
                </div>
                <h3 className="text-lg font-semibold text-libro-warmgray-800 mb-2">{feature.title}</h3>
                <p className="text-libro-warmgray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-libro-warmgray-800 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-libro-warmgray-600 max-w-2xl mx-auto">
              Choose the plan that fits your library. All plans include a 7-day free trial.
            </p>
          </div>
          
          {isLoadingTiers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-libro-coral-500 animate-spin" />
            </div>
          ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {tiers.map((tier, index) => (
              <div 
                key={tier.id}
                className={`relative rounded-2xl p-8 ${
                  index === tiers.length - 1 
                    ? 'bg-libro-coral-500 text-white shadow-xl scale-105' 
                    : 'bg-white shadow-lg'
                }`}
              >
                {index === tiers.length - 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-libro-warmgray-800 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                
                <h3 className={`text-xl font-semibold mb-2 ${index === tiers.length - 1 ? 'text-white' : 'text-libro-warmgray-800'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mb-4 ${index === tiers.length - 1 ? 'text-white/80' : 'text-libro-warmgray-500'}`}>
                  {tier.description}
                </p>
                
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${index === tiers.length - 1 ? 'text-white' : 'text-libro-warmgray-800'}`}>
                    ${tier.price_yearly}
                  </span>
                  <span className={index === tiers.length - 1 ? 'text-white/80' : 'text-libro-warmgray-500'}>
                    /year
                  </span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {(Array.isArray(tier.features) ? tier.features : []).map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <Check className={`w-5 h-5 ${index === tiers.length - 1 ? 'text-white' : 'text-libro-green-500'}`} />
                      <span className={index === tiers.length - 1 ? 'text-white/90' : 'text-libro-warmgray-600'}>
                        {typeof feature === 'string' ? feature : feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to={`/register?plan=${tier.code}`}
                  className={`block w-full py-3 rounded-xl font-medium text-center transition-colors ${
                    index === tiers.length - 1
                      ? 'bg-white text-libro-coral-500 hover:bg-libro-cream-50'
                      : 'bg-libro-coral-500 text-white hover:bg-libro-coral-600'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-libro-warmgray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Library?
          </h2>
          <p className="text-lg text-libro-warmgray-300 mb-8">
            Join thousands of libraries worldwide using Libro ILMS.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-libro-coral-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-libro-coral-600 transition-colors">
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-libro-warmgray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-libro-coral-400 to-libro-coral-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-libro-warmgray-800">Libro ILMS</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-libro-warmgray-500">
            <a href="#" className="hover:text-libro-coral-500">Privacy Policy</a>
            <a href="#" className="hover:text-libro-coral-500">Terms of Service</a>
            <a href="#" className="hover:text-libro-coral-500">Contact</a>
          </div>
          
          <p className="text-sm text-libro-warmgray-500">
            © {new Date().getFullYear()} Libro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
