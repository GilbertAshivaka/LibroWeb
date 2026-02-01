import { Outlet } from 'react-router-dom'

/**
 * Layout for embedded pages (Qt WebView).
 * Minimal wrapper with no navigation - content fills the view.
 */
export default function EmbedLayout() {
  return (
    <div className="min-h-screen bg-libro-cream-50">
      <Outlet />
    </div>
  )
}
