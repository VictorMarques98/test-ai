import { app, BrowserWindow, shell, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
	initDatabase,
	closeDatabase,
	setStoreData,
	getStoreData,
	getAllStoreData,
	deleteStoreData,
	clearStore,
} from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
	// Create the browser window
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.cjs"),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
		},
		show: false, // Don't show until ready-to-show
	});

	// Load the app
	if (process.env.VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
		// Open the DevTools in development
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
	}

	// Show window when ready to prevent flickering
	mainWindow.once("ready-to-show", () => {
		mainWindow?.show();
	});

	// Open external links in the default browser
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("http:") || url.startsWith("https:")) {
			shell.openExternal(url);
			return { action: "deny" };
		}
		return { action: "allow" };
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows
app.whenReady().then(() => {
	// Initialize database
	initDatabase();

	// Setup IPC handlers for database operations
	ipcMain.handle("db:set", (_event, key: string, value: string) => {
		setStoreData(key, value);
		return true;
	});

	ipcMain.handle("db:get", (_event, key: string) => {
		return getStoreData(key);
	});

	ipcMain.handle("db:getAll", () => {
		return getAllStoreData();
	});

	ipcMain.handle("db:delete", (_event, key: string) => {
		deleteStoreData(key);
		return true;
	});

	ipcMain.handle("db:clear", () => {
		clearStore();
		return true;
	});

	createWindow();

	app.on("activate", () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
	closeDatabase();
	if (process.platform !== "darwin") {
		app.quit();
	}
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient("kitchen-companion");

// Security: Prevent navigation to external URLs in the main window
app.on("web-contents-created", (_, contents) => {
	contents.on("will-navigate", (event, navigationUrl) => {
		const parsedUrl = new URL(navigationUrl);
		const parsedAppUrl = new URL(contents.getURL());

		// Allow same-origin navigation
		if (parsedUrl.origin !== parsedAppUrl.origin) {
			event.preventDefault();
			shell.openExternal(navigationUrl);
		}
	});
});
