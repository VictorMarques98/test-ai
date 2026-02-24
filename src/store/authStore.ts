import { create } from "zustand";
import { persist } from "zustand/middleware";

const ACCESS_TOKEN_EXPIRY_BUFFER_SEC = 60; // refresh when less than 1 min left

/** Decode userId from JWT payload (sub, userId or id). No verification. */
function getUserIdFromToken(accessToken: string): string | null {
	try {
		const payload = accessToken.split(".")[1];
		if (!payload) return null;
		const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
		return decoded.sub ?? decoded.userId ?? decoded.id ?? null;
	} catch {
		return null;
	}
}

interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	accessTokenExpiresAt: number | null;
	userId: string | null;
	setTokens: (
		accessToken: string,
		refreshToken: string,
		expiresInSeconds?: number,
		userId?: string
	) => void;
	clearTokens: () => void;
	getAccessToken: () => string | null;
	shouldRefreshAccessToken: () => boolean;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			accessToken: null,
			refreshToken: null,
			accessTokenExpiresAt: null,
			userId: null,

			setTokens: (accessToken, refreshToken, expiresInSeconds = 900, userId) => {
				const expiresAt =
					expiresInSeconds > 0
						? Date.now() + expiresInSeconds * 1000
						: null;
				const resolvedUserId =
					userId !== undefined ? userId : getUserIdFromToken(accessToken);
				set({
					accessToken,
					refreshToken,
					accessTokenExpiresAt: expiresAt,
					userId: resolvedUserId ?? get().userId,
				});
			},

			clearTokens: () =>
				set({
					accessToken: null,
					refreshToken: null,
					accessTokenExpiresAt: null,
					userId: null,
				}),

			getAccessToken: () => get().accessToken,

			shouldRefreshAccessToken: () => {
				const { accessTokenExpiresAt } = get();
				if (!accessTokenExpiresAt) return false;
				return Date.now() >= accessTokenExpiresAt - ACCESS_TOKEN_EXPIRY_BUFFER_SEC * 1000;
			},
		}),
		{
			name: "auth-store",
			partialize: (state) => ({
				accessToken: state.accessToken,
				refreshToken: state.refreshToken,
				accessTokenExpiresAt: state.accessTokenExpiresAt,
				userId: state.userId,
			}),
		}
	)
);

// Derived selector for components (Zustand persist rehydrates async, so use getState in api)
export const isAuthenticatedSelector = (state: AuthState) => !!state.accessToken;
