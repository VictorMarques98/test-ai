import type { PersistStorage, StorageValue } from "zustand/middleware";

/**
 * Custom storage adapter that uses Electron's SQLite database
 * instead of browser localStorage
 */
export const electronDatabaseStorage: PersistStorage<unknown> = {
	getItem: async (name: string): Promise<StorageValue<unknown> | null> => {
		try {
			// Check if we're in Electron context
			if (typeof window !== "undefined" && window.database) {
				const value = await window.database.get(name);
				return value ? (JSON.parse(value) as StorageValue<unknown>) : null;
			}
			// Fallback to localStorage for non-Electron environments (e.g., tests)
			const value = localStorage.getItem(name);
			return value ? (JSON.parse(value) as StorageValue<unknown>) : null;
		} catch (error) {
			console.error("Error reading from database:", error);
			return null;
		}
	},

	setItem: async (name: string, value: StorageValue<unknown>): Promise<void> => {
		try {
			const stringValue = JSON.stringify(value);
			// Check if we're in Electron context
			if (typeof window !== "undefined" && window.database) {
				await window.database.set(name, stringValue);
				return;
			}
			// Fallback to localStorage for non-Electron environments
			localStorage.setItem(name, stringValue);
		} catch (error) {
			console.error("Error writing to database:", error);
		}
	},

	removeItem: async (name: string): Promise<void> => {
		try {
			// Check if we're in Electron context
			if (typeof window !== "undefined" && window.database) {
				await window.database.delete(name);
				return;
			}
			// Fallback to localStorage for non-Electron environments
			localStorage.removeItem(name);
		} catch (error) {
			console.error("Error removing from database:", error);
		}
	},
};
