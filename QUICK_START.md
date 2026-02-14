# Quick Start Guide - Kitchen Companion Electron App

## 🚀 Quick Commands

```bash
# Install dependencies (first time only)
npm install

# Start development (launches Electron with hot reload)
npm run dev

# Build for production
npm run build

# Create distributable packages
npm run package          # All platforms
npm run package:mac      # macOS only
npm run package:win      # Windows only
npm run package:linux    # Linux only
```

## 📁 Key Files

- `electron/main.ts` - Electron main process (window management)
- `electron/preload.ts` - Secure bridge between main and renderer
- `src/App.tsx` - React app (now uses HashRouter)
- `vite.config.ts` - Vite configuration with Electron plugin
- `package.json` - Dependencies and scripts

## 🔧 Development Workflow

1. Make changes to React code in `src/`
2. Changes hot-reload automatically in Electron window
3. Check DevTools (opens automatically in dev mode)
4. Test your changes

## 📦 Building & Packaging

```bash
# Step 1: Build the web app
npm run build

# Step 2: Build Electron files
npm run build:electron

# Step 3: Package for your platform
npm run package:mac  # or :win or :linux
```

Output will be in `release/` directory.

## 🐛 Troubleshooting

**Electron won't start?**
```bash
rm -rf node_modules dist dist-electron
npm install
npm run dev
```

**Build errors?**
```bash
rm -rf dist dist-electron
npm run build
```

**Port 8080 in use?**
- Change port in `vite.config.ts` (server.port)
- Update port in `electron/main.ts` (VITE_DEV_SERVER_URL)

## 📚 More Information

See `ELECTRON_SETUP.md` for complete documentation.
See `MIGRATION_SUMMARY.md` for details on all changes made.

## ✅ Verified Working

- ✅ Development mode with hot reload
- ✅ Production builds
- ✅ TypeScript compilation
- ✅ All security features enabled
- ✅ Cross-platform compatibility

Happy coding! 🎉
