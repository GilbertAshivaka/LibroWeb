import { useState, useEffect } from 'react'
import { releasesAPI } from '../api'
import { 
  Download, 
  BookOpen, 
  Shield, 
  Zap, 
  CheckCircle, 
  FileText,
  Monitor,
  HardDrive,
  Loader2,
  ExternalLink
} from 'lucide-react'

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function DownloadPage() {
  const [release, setRelease] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchLatestRelease()
  }, [])
  
  const fetchLatestRelease = async () => {
    try {
      const response = await releasesAPI.getLatest()
      setRelease(response.data)
    } catch (err) {
      setError('No releases available yet.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const features = [
    { icon: BookOpen, title: 'Complete Cataloging', description: 'Manage your entire collection with MARC21 support' },
    { icon: Zap, title: 'Fast Circulation', description: 'Check in/out books in seconds with barcode scanning' },
    { icon: Shield, title: 'Secure & Reliable', description: 'Enterprise-grade security with automatic backups' },
    { icon: Monitor, title: 'Modern Interface', description: 'Beautiful Qt-based interface that\'s easy to use' },
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-libro-cream-50 to-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-libro-coral-500 to-libro-coral-600" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-2xl mb-6">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Libro ILMS
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              The complete Integrated Library Management System for modern libraries.
              Powerful, beautiful, and easy to use.
            </p>
            
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </div>
            ) : release ? (
              <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                <a
                  href={`/api/v1/downloads/file/${release.version}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-libro-coral-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  <Download className="w-6 h-6" />
                  Download for Windows
                </a>
                <span className="text-white/80 text-sm">
                  Version {release.version} • {formatBytes(release.file_size)}
                </span>
              </div>
            ) : (
              <p className="text-white/80">{error}</p>
            )}
          </div>
        </div>
      </header>
      
      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-libro-warmgray-800 text-center mb-12">
          Everything you need to manage your library
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-libro-coral-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-libro-coral-500" />
              </div>
              <h3 className="font-semibold text-libro-warmgray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-libro-warmgray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Release Info */}
      {release && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="card p-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">
              {/* Release Details */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-libro-warmgray-800 mb-4">
                  {release.release_name || `Libro ${release.version}`}
                </h2>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-5 h-5 text-libro-warmgray-400" />
                    <span className="text-libro-warmgray-600">Version {release.version}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <HardDrive className="w-5 h-5 text-libro-warmgray-400" />
                    <span className="text-libro-warmgray-600">{formatBytes(release.file_size)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Monitor className="w-5 h-5 text-libro-warmgray-400" />
                    <span className="text-libro-warmgray-600">Windows 10 or later</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="w-5 h-5 text-libro-warmgray-400" />
                    <span className="text-libro-warmgray-600 font-mono text-xs truncate">
                      SHA256: {release.checksum_sha256?.substring(0, 16)}...
                    </span>
                  </div>
                </div>
                
                {release.release_notes && (
                  <div>
                    <h3 className="font-medium text-libro-warmgray-700 mb-2">What's New</h3>
                    <div className="prose prose-sm text-libro-warmgray-600 max-w-none">
                      {release.release_notes.split('\n').map((line, i) => (
                        <p key={i} className="flex items-start gap-2 mb-1">
                          {line.startsWith('-') || line.startsWith('•') ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-libro-green-500 mt-0.5 flex-shrink-0" />
                              <span>{line.replace(/^[-•]\s*/, '')}</span>
                            </>
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Download Box */}
              <div className="lg:w-80 bg-libro-cream-50 rounded-xl p-6">
                <h3 className="font-semibold text-libro-warmgray-800 mb-4">System Requirements</h3>
                <ul className="space-y-2 text-sm text-libro-warmgray-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-libro-green-500" />
                    Windows 10/11 (64-bit)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-libro-green-500" />
                    8 GB RAM minimum
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-libro-green-500" />
                    5 GB disk space
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-libro-green-500" />
                    1920x1080 display
                  </li>
                </ul>
                
                <a
                  href={`/api/v1/downloads/file/${release.version}`}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Now
                </a>
                
                <p className="text-xs text-libro-warmgray-500 text-center mt-3">
                  By downloading, you agree to our terms of service.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Footer */}
      <footer className="border-t border-libro-warmgray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-libro-warmgray-500">
          <p>© 2026 Libro ILMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
