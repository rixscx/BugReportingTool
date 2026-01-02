<div align="center">

# 🐛 Bug Reporting Tool

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Professional bug tracking system with real-time collaboration and workflow management.**

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

- 🎯 **Bug Management** - Create, edit, track with custom statuses and priorities
- 📊 **Analytics** - Real-time statistics, trends, and metrics
- 🎨 **Multiple Views** - List, Kanban board, and timeline
- 👥 **Collaboration** - Comments, mentions, activity tracking
- ⌨️ **Shortcuts** - Ctrl+K quick actions, extensive keyboard navigation
- 📸 **File Management** - Drag-and-drop uploads, image preview
- 🔐 **Security** - RLS policies, session management, HTTPS-ready
- 📱 **Responsive** - Mobile-first, touch-friendly, PWA-ready
- 💾 **Real-time Sync** - Live updates with offline support

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, React Router 7
- **Backend**: Supabase (PostgreSQL, RLS, Auth)
- **Tools**: ESLint, Docker, Nginx

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
git add . && git commit -m "Production ready"
git push origin main
# Visit vercel.com, import repo, set env vars, deploy!
```

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

## 🔐 Security

- Environment variables for sensitive data
- Row-Level Security (RLS) policies
- Session management with auto-refresh
- Security headers configured
- No console logs in production
- HTTPS/SSL ready

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