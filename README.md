<div align="center">

# 🐛 Bug Reporting Tool

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Professional bug tracking system with real-time collaboration, OAuth support, and workflow management.**

[Features](#-features) • [Quick Start](#-quick-start) • [Testing](#-testing-the-application) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## ✨ Features

- 🎯 **Bug Management** - Create, edit, track with custom statuses and priorities
- 📊 **Analytics** - Real-time statistics, trends, and metrics
- 🎨 **Multiple Views** - List, Kanban board, and timeline views
- 👥 **Collaboration** - Comments, mentions, activity tracking
- ⌨️ **Shortcuts** - Ctrl+K quick actions, extensive keyboard navigation
- 📸 **File Management** - Drag-and-drop uploads, image preview
- 🔑 **OAuth** - Google sign-in support with automatic profile creation
- �️ **Avatar System** - Procedural geometric avatars + custom uploads (max 2MB)
- 👤 **Profile Management** - Edit username, full name, and avatar
- 🗑️ **Account Deletion** - Production-grade secure account removal
- 🔐 **Security** - RLS policies, session management, HTTPS-ready
- 📱 **Responsive** - Mobile-first, touch-friendly, PWA-ready
- 💾 **Real-time Sync** - Live updates with offline support

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, React Router 7
- **Backend**: Supabase (PostgreSQL, RLS, Auth, Realtime)
- **Auth**: Email/Password + Google OAuth
- **Tools**: ESLint, Docker, Nginx

## 🧪 Testing the Application

### Test Accounts

For quick testing without creating real accounts, use these pre-verified profiles:

| Email | Password | Role | Features |
|-------|----------|------|----------|
| `test.user@gmail.com` | `Test@123` | User | Create/view bugs, comment |
| `test.admin@gmail.com` | `Admin@123` | Admin | Full access + user management |

**Note:** Test accounts cannot be deleted. This prevents accidental testing data loss.

### Test Features

1. **Sign In** - Use test credentials above or Google OAuth
2. **Create Bugs** - Report test issues with markdown support
3. **Assign & Status** - Change bug status and assignments
4. **Comments** - Add comments and mentions
5. **Real-time** - See live updates across tabs
6. **Sign Out** - Logs out and redirects to login page
7. **Delete Profile** - Permanently delete account (not available for test accounts)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- Supabase Account ([Free tier](https://supabase.com/))

### Installation

```bash
# Clone and setup
git clone https://github.com/rixscx/BugReportingTool.git
cd BugReportingTool

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development
npm run dev
# Visit http://localhost:5173
```

### Production Build

```bash
npm run build       # Build optimized version
npm run preview     # Test production build locally
```

## 📦 Bundle Size

- ✅ **70% reduction** - From 537KB to 160KB (gzipped)
- ✅ **Code splitting** - 8 intelligent chunks
- ✅ **Lazy loading** - Pages load on-demand
- ✅ **Gzip compression** - All assets compressed

## 🚀 Deployment

Quick deployment options:

| Platform | Time | Notes |
|----------|------|-------|
| **Vercel** ⭐ | 3 min | Auto-deploys on push |
| **Docker** | 5 min | Full stack included |
| **GitHub Pages** | 2 min | Static hosting |
| **AWS ECS** | 15 min | Enterprise ready |
| **Railway** | 5 min | Generous free tier |

### Vercel (Fastest)
```bash
git push origin main
# Vercel auto-deploys from GitHub
```

**Environment Variables Setup:**
In Vercel Dashboard → Settings → Environment Variables, add:
- `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `your-anon-key-here`

**After Deployment:**
1. Copy your Vercel URL (e.g., `https://bugreporttool.vercel.app`)
2. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   - `https://bugreporttool.vercel.app/`
   - `https://bugreporttool.vercel.app/auth/callback`
4. Set **Site URL**: `https://bugreporttool.vercel.app`
5. Click **Save**

### Docker
```bash
cp .env.example .env.production
npm run docker:compose
# Visit http://localhost:3000
```

For detailed guides, see [QUICK_DEPLOY.md](QUICK_DEPLOY.md).

## 📚 Documentation

- **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - 7 deployment methods
- **[PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md)** - Detailed setup
- **[COMMANDS_REFERENCE.md](COMMANDS_REFERENCE.md)** - CLI commands
- **[OPTIMIZATION_REPORT.md](OPTIMIZATION_REPORT.md)** - Technical details
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - Pre-launch verification

## 🔧 Scripts

```bash
npm run dev              # Development server
npm run build           # Production build
npm run build:prod      # Build + linting
npm run preview         # Preview production
npm run lint            # ESLint check
npm run docker:build    # Build Docker image
npm run docker:compose  # Start full stack
```

## 📁 Project Structure

```
src/
├── components/         # UI components
├── pages/             # Lazy-loaded pages
├── hooks/             # Custom React hooks
├── lib/               # Utilities & config
├── assets/            # Images & fonts
├── App.jsx
└── main.jsx
```

## 🔐 Security & OAuth

### Email/Password Authentication
- Passwords are hashed with bcrypt
- Email verification required for new accounts
- Session tokens auto-refresh
- HTTPS/SSL required in production

### Google OAuth Integration

**OAuth Data Storage:**
Yes! When users sign in with Google, their profile is automatically created with:
- Email address
- Full name (from Google account)
- Avatar URL (profile picture)
- User ID (from Supabase auth)
- Role (defaults to 'user')

All data is stored in the `profiles` table in Supabase.

**Setup Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth Client ID (Web application)
3. Add authorized origins: `https://YOUR-PROJECT.supabase.co`
4. Add callback: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret
6. Supabase Dashboard → Authentication → Providers → Google
7. 🎯 Account Management

### Profile Actions

**Available from Profile Menu (Top Right):**
- View your profile information
- View keyboard shortcuts
- Sign out
- **Delete Account** (not available for test accounts)

### Avatar System

**Procedural Generation:**
- Unique geometric pattern avatars generated from your user ID
- Deterministic (same ID = same avatar)
- No external API dependencies
- Instant generation

**Custom Upload:**
- Upload your own avatar (JPG, PNG, GIF, WebP)
- Maximum file size: 2MB
- Automatic image optimization
- Stored securely in Supabase Storage

**Avatar Actions:**
- Click to upload new image
- Remove uploaded avatar (reverts to generated pattern)
- Instant preview before saving

### Delete Account

**Production-Grade Security:**
When you delete your account, the system performs a transaction-safe cleanup:
- ✅ All your bugs are deleted (CASCADE)
- ✅ All your comments are removed (CASCADE)
- ✅ Avatar files deleted from storage
- ✅ Profile data permanently removed
- ✅ Authentication credentials erased
- ✅ Cannot log back in after deletion
- ✅ Requires confirmation dialog with detailed warning

**Important:**
- ❌ Action cannot be undone
- ❌ Test accounts cannot be deleted (protects demo data)
- ✅ Transaction-safe (all-or-nothing)
- ✅ RLS policies enforce proper authorization

**Note:** Test accounts (`test.user@gmail.com`, `test.admin@gmail.com`) cannot be deleted to protect demo data.

## 🤝 Contributing

1. Fork the repository
2. Creater enhanced security
- Row-Level Security (RLS) policies in database
- Secure session management
- Auto-logout on inactivity
- Data isolation per user

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m "feat: add feature"`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Commit Convention:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rixscx/BugReportingTool/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rixscx/BugReportingTool/discussions)

---

**Status**: ✅ Production Ready | **Version**: 1.0.0 | **Last Updated**: Jan 2, 2026

<div align="center">

Made with ❤️ by [rixscx](https://github.com/rixscx)

If this project helped you, please give it a ⭐!

</div>