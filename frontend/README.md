# Libro Web Frontend

Modern React-based admin portal and embedded pages for Libro ILMS.

## Features

- 🎨 **Modern UI** - Built with React 18, TailwindCSS, and warm coral theme
- 🔐 **Admin Portal** - Full CRUD for organizations, licenses, announcements, etc.
- 🤖 **AI Chat** - Embedded Libro AI powered by Gemini for Qt WebView
- 📢 **Announcements** - Public announcements page for Qt WebView
- 📥 **Downloads** - Public download page with resume support for large files

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API client and endpoints
│   ├── layouts/        # Page layouts
│   │   ├── AdminLayout.jsx
│   │   └── EmbedLayout.jsx
│   ├── pages/
│   │   ├── admin/      # Admin portal pages
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── OrganizationsPage.jsx
│   │   │   ├── LicensesPage.jsx
│   │   │   ├── AnnouncementsPage.jsx
│   │   │   ├── ReleasesPage.jsx
│   │   │   ├── PaymentsPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── embed/      # Embedded pages for Qt WebView
│   │   │   ├── EmbedAIPage.jsx
│   │   │   └── EmbedAnnouncementsPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── DownloadPage.jsx
│   ├── store/          # Zustand stores
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css       # Tailwind + custom styles
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── postcss.config.js
```

## Routes

### Public Routes
- `/login` - Admin login page
- `/download` - Public download page for Libro installer

### Embedded Routes (for Qt WebView)
- `/embed/ai` - AI chat interface
- `/embed/announcements` - Public announcements

### Admin Routes (protected)
- `/admin` - Dashboard
- `/admin/organizations` - Organizations list
- `/admin/organizations/:id` - Organization detail
- `/admin/licenses` - Licenses management
- `/admin/announcements` - Announcements management
- `/admin/releases` - App releases management
- `/admin/payments` - Payments records
- `/admin/users` - Admin users management
- `/admin/settings` - Subscription tiers and settings

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file for configuration:

```env
VITE_API_URL=http://localhost:8000
```

## Theme Colors

The UI uses a warm, cozy color palette matching the Libro desktop app:

- **Coral** (#ec6b5b) - Primary actions, accents
- **Cream** (#faf8f5) - Backgrounds
- **Warm Gray** - Text and borders
- **Blue** (#4a90d9) - Secondary actions
- **Green** (#22c55e) - Success states
- **Amber** (#f59e0b) - Warning states

## Integration with Qt WebView

The embedded pages are designed to work inside Qt WebView:

```cpp
// In Qt/C++
QWebEngineView *view = new QWebEngineView();
view->load(QUrl("https://your-domain.com/embed/ai"));
```

The embedded pages:
- Use minimal, clean UI
- Work without authentication
- Auto-fit mobile/tablet/desktop views
- Support dark mode (future)
