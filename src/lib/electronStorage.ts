import type { PersistStorage, StorageValue } from "zustand/middleware";

/**
 * Custom storage adapter that uses Electron's file database
 * Synchronous wrapper around async IPC calls for Zustand compatibility
 */
export const electronDatabaseStorage: PersistStorage<unknown> = {
	getItem: (name: string): StorageValue<unknown> | null => {
		try {
			// Check if we're in Electron context
			if (typeof window !== "undefined" && window.database) {
				// Note: This is synchronous for Zustand, but uses cached data
				// The actual async load happens on app start
				const value = localStorage.getItem(`__electron_cache_${name}`);
				if (value) {
					return JSON.parse(value) as StorageValue<unknown>;
				}
			}
			// Fallback to localStorage for non-Electron environments (e.g., tests)
			const value = localStorage.getItem(name);
			return value ? (JSON.parse(value) as StorageValue<unknown>) : null;
		} catch (error) {
			console.error("Error reading from storage:", error);
			return null;
		}
	},

	setItem: (name: string, value: StorageValue<unknown>): void => {
		try {
			const stringValue = JSON.stringify(value);
			// Check if we're in Electron context
			if (typeof window !== "undefined" && window.database) {
				// Save to localStorage cache immediately (synchronous)
				localStorage.setItem(`__electron_cache_${name}`, stringValue);
				// Also save to database (async, fire and forget)
				window.database.set(name, stringValue).catch((err) => {
					console.error("Error writing to database:", err);
				});
			} else {
				// Fallback to localStorage for non-Electron environments
				localStorage.setItem(name, stringValue);
			}
		} catch (error) {
			console.error("Error writing to storage:", error);
		}
	},

	removeItem: (name: string): void => {
		try {
			// Check if we're in Electron context
			if (typeof window !== "undefined" && window.database) {
				localStorage.removeItem(`__electron_cache_${name}`);
				window.database.delete(name).catch((err) => {
					console.error("Error removing from database:", err);
				});
			} else {
				// Fallback to localStorage for non-Electron environments
				localStorage.removeItem(name);
			}
		} catch (error) {
			console.error("Error removing from storage:", error);
		}
	},
};

/**
 * Initialize storage by loading data from database into localStorage cache
 * Call this when the app starts
 */
export async function initElectronStorage() {
	if (typeof window !== "undefined" && window.database) {
		try {
			const allData = await window.database.getAll();
			// Populate localStorage cache with database data
			for (const [key, value] of Object.entries(allData)) {
				localStorage.setItem(`__electron_cache_${key}`, value);
			}
		} catch (error) {
			console.error("Error initializing electron storage:", error);
		}
	}
}
