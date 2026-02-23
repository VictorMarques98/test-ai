import { create } from "zustand";
import { persist } from "zustand/middleware";

const ACCESS_TOKEN_EXPIRY_BUFFER_SEC = 60; // refresh when less than 1 min left

interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	accessTokenExpiresAt: number | null;
	setTokens: (
		accessToken: string,
		refreshToken: string,
		expiresInSeconds?: number
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

			setTokens: (accessToken, refreshToken, expiresInSeconds = 900) => {
				const expiresAt =
					expiresInSeconds > 0
						? Date.now() + expiresInSeconds * 1000
						: null;
				set({
					accessToken,
					refreshToken,
					accessTokenExpiresAt: expiresAt,
				});
			},

			clearTokens: () =>
				set({
					accessToken: null,
					refreshToken: null,
					accessTokenExpiresAt: null,
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
			}),
		}
	)
);

// Derived selector for components (Zustand persist rehydrates async, so use getState in api)
export const isAuthenticatedSelector = (state: AuthState) => !!state.accessToken;
