import { app } from "electron";
import path from "path";
import fs from "fs";

interface StoreData {
	[key: string]: string;
}

let storePath: string;
let store: StoreData = {};

export function initDatabase() {
	const userDataPath = app.getPath("userData");
	storePath = path.join(userDataPath, "kitchen-companion-store.json");

	// Ensure the directory exists
	fs.mkdirSync(userDataPath, { recursive: true });

	// Load existing data if available
	try {
		if (fs.existsSync(storePath)) {
			const data = fs.readFileSync(storePath, "utf-8");
			store = JSON.parse(data);
			console.log("Database loaded from:", storePath);
		} else {
			// Create empty store file
			fs.writeFileSync(storePath, JSON.stringify({}), "utf-8");
			console.log("Database initialized at:", storePath);
		}
	} catch (error) {
		console.error("Error initializing database:", error);
		store = {};
	}

	return store;
}

function saveStore() {
	try {
		fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
	} catch (error) {
		console.error("Error saving store:", error);
	}
}

export function closeDatabase() {
	saveStore();
}

// Store operations
export function setStoreData(key: string, value: string): void {
	store[key] = value;
	saveStore();
}

export function getStoreData(key: string): string | null {
	return store[key] || null;
}

export function getAllStoreData(): Record<string, string> {
	return { ...store };
}

export function deleteStoreData(key: string): void {
	delete store[key];
	saveStore();
}

export function clearStore(): void {
	store = {};
	saveStore();
}
