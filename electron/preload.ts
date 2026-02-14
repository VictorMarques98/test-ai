import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
	// Example: send data to main process
	send: (channel: string, data: unknown) => {
		// Whitelist channels
		const validChannels = ["toMain"];
		if (validChannels.includes(channel)) {
			ipcRenderer.send(channel, data);
		}
	},
	// Example: receive data from main process
	receive: (channel: string, func: (...args: unknown[]) => void) => {
		const validChannels = ["fromMain"];
		if (validChannels.includes(channel)) {
			// Deliberately strip event as it includes `sender`
			ipcRenderer.on(channel, (_event, ...args) => func(...args));
		}
	},
	// Example: invoke (request-response pattern)
	invoke: (channel: string, data?: unknown) => {
		const validChannels = ["getData"];
		if (validChannels.includes(channel)) {
			return ipcRenderer.invoke(channel, data);
		}
	},
	// Get platform info
	platform: process.platform,
	// App version
	version: process.env.npm_package_version || "1.0.0",
});

// Expose only safe APIs to the renderer process
contextBridge.exposeInMainWorld("api", {
	platform: process.platform,
	isElectron: true,
});
