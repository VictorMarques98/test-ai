export interface IElectronAPI {
	send: (channel: string, data: unknown) => void;
	receive: (channel: string, func: (...args: unknown[]) => void) => void;
	invoke: (channel: string, data?: unknown) => Promise<unknown>;
	platform: string;
	version: string;
}

export interface IApi {
	platform: string;
	isElectron: boolean;
}

declare global {
	interface Window {
		electron: IElectronAPI;
		api: IApi;
	}
}
