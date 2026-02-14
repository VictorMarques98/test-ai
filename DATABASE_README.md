# Database Quick Reference

## 🎯 Overview
Your app now uses a **file-based JSON database** instead of browser localStorage.

## 📍 Data Location

Your restaurant data is stored at:
- **macOS**: `~/Library/Application Support/kitchen-companion/kitchen-companion-store.json`
- **Windows**: `%APPDATA%\kitchen-companion\kitchen-companion-store.json`
- **Linux**: `~/.config/kitchen-companion/kitchen-companion-store.json`

## 🔄 How It Works

1. **Zustand Store** → Automatically persists to database
2. **Data Saves** → Written to JSON file immediately
3. **App Restart** → Data automatically loaded

## ✨ Features

✅ No browser dependency
✅ Data persists across app restarts
✅ Each user has their own data file
✅ Human-readable JSON format
✅ Easy to backup/restore
✅ No compilation issues
✅ Cross-platform compatible

## 📋 Common Tasks

### View Your Data
```bash
# macOS
cat ~/Library/Application\ Support/kitchen-companion/kitchen-companion-store.json
```

### Backup Data
```bash
# macOS
cp ~/Library/Application\ Support/kitchen-companion/kitchen-companion-store.json ~/Desktop/backup.json
```

### Reset Data
Delete the file or use the clear function:
```typescript
await window.database.clear();
```

## 🔍 Key Files

- [`electron/database.ts`](electron/database.ts) - Database logic
- [`src/lib/electronStorage.ts`](src/lib/electronStorage.ts) - Zustand adapter
- [`src/store/restaurantStore.ts`](src/store/restaurantStore.ts) - Your store

## 📚 More Info

See [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) for complete documentation.
