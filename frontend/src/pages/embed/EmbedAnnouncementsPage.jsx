import { useState, useEffect } from 'react'
import { announcementsAPI } from '../../api'
import { Megaphone, AlertTriangle, Info, Bell, Calendar, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

export default function EmbedAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchAnnouncements()
  }, [])
  
  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const response = await announcementsAPI.getPublic()
      setAnnouncements(response.data)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      setError('Unable to load announcements')
    } finally {
      setIsLoading(false)
    }
  }
  
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'high':
        return <Bell className="w-5 h-5 text-libro-amber-500" />
      default:
        return <Info className="w-5 h-5 text-libro-blue-500" />
    }
  }
  
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-4 border-l-libro-amber-500 bg-libro-amber-50'
      default:
        return 'border-l-4 border-l-libro-blue-500 bg-white'
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-libro-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-libro-coral-500 animate-spin mx-auto mb-3" />
          <p className="text-libro-warmgray-500">Loading announcements...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-libro-cream-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-libro-amber-500 mx-auto mb-3" />
          <p className="text-libro-warmgray-700">{error}</p>
          <button
            onClick={fetchAnnouncements}
            className="mt-4 px-4 py-2 bg-libro-coral-500 text-white rounded-lg hover:bg-libro-coral-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-libro-cream-50">
      {/* Content */}
      <main className="max-w-2xl mx-auto p-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-16 h-16 text-libro-warmgray-200 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-libro-warmgray-700 mb-2">No Announcements</h2>
            <p className="text-libro-warmgray-500">
              There are no announcements at this time.<br />
              Check back later for updates!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <article 
                key={announcement.id}
                className={`rounded-xl shadow-sm overflow-hidden ${getPriorityStyle(announcement.priority)}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    {getPriorityIcon(announcement.priority)}
                    <div className="flex-1">
                      <h2 className="font-semibold text-libro-warmgray-800 text-lg">
                        {announcement.title}
                      </h2>
                      {announcement.start_date && (
                        <p className="text-sm text-libro-warmgray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(announcement.start_date), 'MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    {announcement.priority === 'critical' && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                        Critical
                      </span>
                    )}
                    {announcement.priority === 'high' && (
                      <span className="px-2 py-1 bg-libro-amber-500 text-white text-xs font-medium rounded-full">
                        Important
                      </span>
                    )}
                  </div>
                  
                  <div 
                    className="prose prose-sm prose-libro max-w-none text-libro-warmgray-600"
                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-6 text-center text-sm text-libro-warmgray-400">
        <p>© {new Date().getFullYear()} Libro ILMS</p>
      </footer>
    </div>
  )
}
