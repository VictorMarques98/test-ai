# Kitchen Companion - Electron Desktop Application

A powerful restaurant management desktop application built with Electron, React, TypeScript, and Vite.

## Project Overview

Kitchen Companion is a full-featured restaurant management system that runs as a native desktop application on macOS, Windows, and Linux. It provides comprehensive tools for managing inventory, dishes, orders, and clients.

## Technologies Used

- **Electron** - Desktop application framework
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library
- **React Router** - Client-side routing (HashRouter for Electron compatibility)
- **Zustand** - State management
- **React Query** - Data fetching and caching

## Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## Getting Started

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd kitchen-companion

# Install dependencies
npm install
```

### Development

```sh
# Start the development server with Electron hot reload
npm run dev
```

This will:
- Start the Vite dev server on http://localhost:8080
- Launch the Electron application
- Enable hot module replacement (HMR)
- Open DevTools automatically

### Building

```sh
# Build the web application
npm run build

# Build the Electron main process
npm run build:electron
```

### Packaging

Package the application for distribution:

```sh
# Package for all platforms
npm run package

# Package for macOS only (creates .dmg and .zip)
npm run package:mac

# Package for Windows only (creates installer and portable exe)
npm run package:win

# Package for Linux only (creates AppImage and .deb)
npm run package:linux
```

The packaged applications will be created in the `release/` directory.

## Project Structure

```
kitchen-companion/
├── electron/              # Electron main process files
│   ├── main.ts           # Main process entry point
│   ├── preload.ts        # Preload script (context bridge)
│   └── electron.d.ts     # TypeScript definitions for Electron APIs
├── src/                  # React application source
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript type definitions
│   └── App.tsx          # Main App component (uses HashRouter)
├── dist/                # Built web application (created by Vite)
├── dist-electron/       # Built Electron files (created by TypeScript)
├── release/             # Packaged application installers
└── package.json         # Project dependencies and scripts
```

## Key Features

- **Cross-platform**: Runs on macOS, Windows, and Linux
- **Secure**: Context isolation and sandboxed renderer process
- **Modern UI**: Built with React and shadcn/ui components
- **Fast Development**: Vite provides instant HMR
- **Type-safe**: Full TypeScript support throughout the stack
- **Native Integration**: Electron provides native OS integration

## Security

The application follows Electron security best practices:
- ✅ Context isolation enabled
- ✅ Sandbox enabled for renderer process
- ✅ Node integration disabled in renderer
- ✅ Preload script for safe IPC communication
- ✅ Content Security Policy configured
- ✅ External links open in default browser

## Scripts Reference

- `npm run dev` - Start development server with Electron
- `npm run build` - Build the web application for production
- `npm run build:electron` - Compile Electron TypeScript files
- `npm run package` - Package for all platforms
- `npm run package:mac` - Package for macOS
- `npm run package:win` - Package for Windows
- `npm run package:linux` - Package for Linux
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Configuration Files

- `vite.config.ts` - Vite and Electron plugin configuration
- `tsconfig.json` - TypeScript configuration for web app
- `tsconfig.electron.json` - TypeScript configuration for Electron
- `electron-builder` section in `package.json` - Electron Builder configuration

## Troubleshooting

### Electron window doesn't open
- Ensure all dependencies are installed: `npm install`
- Check that port 8080 is not in use
- Look for error messages in the terminal

### Build errors
- Clear the build cache: `rm -rf dist dist-electron`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Hot reload not working
- Check that the Vite dev server is running on port 8080
- Restart the development server

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly on all target platforms
4. Submit a pull request

## License

[Add your license information here]
