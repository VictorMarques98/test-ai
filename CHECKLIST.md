# Electron Development Checklist

## Before First Run
- [x] Dependencies installed (`npm install`)
- [x] TypeScript configuration verified
- [x] Electron files compiled
- [x] No linting errors

## Development Workflow
- [x] Start dev server (`npm run dev`)
- [x] Electron window opens
- [x] Hot reload works
- [x] DevTools accessible
- [x] No console errors

## Before Production Build
- [ ] Update version in package.json
- [ ] Update app name/description
- [ ] Test all features in development
- [ ] Check for console warnings/errors
- [ ] Review security settings
- [ ] Test on target platforms

## Building for Distribution
- [ ] Run `npm run build` successfully
- [ ] Run `npm run build:electron` successfully
- [ ] Test built version loads correctly
- [ ] Verify all routes work with HashRouter
- [ ] Check asset loading (images, fonts, etc.)

## Packaging
- [ ] Add application icons (optional)
  - macOS: icon.icns (512x512)
  - Windows: icon.ico (256x256)
  - Linux: icon.png (512x512)
- [ ] Update package.json build configuration
- [ ] Set code signing (optional, for distribution)
- [ ] Run packaging command for target platform
- [ ] Test packaged application
- [ ] Verify installer works

## Security Checklist
- [x] Context isolation enabled
- [x] Sandbox enabled
- [x] Node integration disabled
- [x] Content Security Policy set
- [x] Preload script secure
- [x] External links handled safely
- [x] No eval() or unsafe code

## Testing Checklist
- [ ] All pages load correctly
- [ ] Navigation works (all routes)
- [ ] Forms submit properly
- [ ] Data persists correctly
- [ ] Images and assets load
- [ ] Responsive design works
- [ ] No memory leaks
- [ ] Performance acceptable

## Documentation
- [x] README updated
- [x] Setup guide created
- [x] Quick start available
- [x] Migration notes documented

## Optional Enhancements
- [ ] Add application menu
- [ ] Add system tray icon
- [ ] Implement auto-updater
- [ ] Add splash screen
- [ ] Set up crash reporting
- [ ] Add keyboard shortcuts
- [ ] Implement native notifications
- [ ] Add deep linking support

## Platform-Specific Testing
- [ ] macOS: DMG installs correctly
- [ ] Windows: Installer works
- [ ] Linux: AppImage/deb installs
- [ ] Touch bar support (macOS)
- [ ] Notification icons (all platforms)

## Pre-Release
- [ ] Version bumped
- [ ] Change log updated
- [ ] All tests passing
- [ ] No TODO/FIXME in critical code
- [ ] License file included
- [ ] Privacy policy (if applicable)

## Distribution
- [ ] Sign application (macOS, Windows)
- [ ] Notarize (macOS)
- [ ] Upload to distribution platform
- [ ] Create release notes
- [ ] Update website/documentation
- [ ] Announce release

---

**Current Status**: ✅ Development Ready
All basic functionality tested and working!
