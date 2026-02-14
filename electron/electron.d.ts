export interface IElectronAPI {
	send: (channel: string, data: unknown) => void;
	receive: (channel: string, func: (...args: unknown[]) => void) => void;
	invoke: (channel: string, data?: unknown) => Promise<unknown>;
	platform: string;
	version: string;
}

export interface IDatabaseAPI {
	set: (key: string, value: string) => Promise<boolean>;
	get: (key: string) => Promise<string | null>;
	getAll: () => Promise<Record<string, string>>;
	delete: (key: string) => Promise<boolean>;
	clear: () => Promise<boolean>;
}

export interface IApi {
	platform: string;
	isElectron: boolean;
}

declare global {
	interface Window {
		electron: IElectronAPI;
		database: IDatabaseAPI;
		api: IApi;
	}
}
