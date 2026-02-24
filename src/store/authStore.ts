import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserAuth } from "@/types/api";

const ACCESS_TOKEN_EXPIRY_BUFFER_SEC = 60; // refresh when less than 1 min left

/** Decode JWT payload (no verification). Returns normalized UserAuth + rest of claims. */
function decodeAccessToken(accessToken: string): UserAuth | null {
	try {
		const payload = accessToken.split(".")[1];
		if (!payload) return null;
		const decoded = JSON.parse(
			atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
		) as Record<string, unknown>;
		const userId =
			(decoded.sub as string) ??
			(decoded.userId as string) ??
			(decoded.id as string) ??
			null;
		if (!userId) return null;
		return {
			userId,
			role: decoded.role as string | undefined,
			tenantId: decoded.tenantId as string | undefined,
			...decoded,
		};
	} catch {
		return null;
	}
}

interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	accessTokenExpiresAt: number | null;
	userAuth: UserAuth | null;
	setTokens: (
		accessToken: string,
		refreshToken: string,
		expiresInSeconds?: number,
		userAuthOverride?: Partial<UserAuth>
	) => void;
	setTenantId: (tenantId: string) => void;
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
			userAuth: null,

			setTokens: (
				accessToken,
				refreshToken,
				expiresInSeconds = 900,
				userAuthOverride
			) => {
				const expiresAt =
					expiresInSeconds > 0
						? Date.now() + expiresInSeconds * 1000
						: null;
				const decoded = decodeAccessToken(accessToken);
				const previous = get().userAuth;
				let resolvedUserAuth: UserAuth | null =
					decoded ?? previous;
				if (resolvedUserAuth && previous?.tenantId != null && decoded?.tenantId == null) {
					resolvedUserAuth = { ...resolvedUserAuth, tenantId: previous.tenantId };
				}
				if (userAuthOverride && resolvedUserAuth) {
					resolvedUserAuth = { ...resolvedUserAuth, ...userAuthOverride };
				}
				set({
					accessToken,
					refreshToken,
					accessTokenExpiresAt: expiresAt,
					userAuth: resolvedUserAuth,
				});
			},

			setTenantId: (tenantId: string) => {
				const { userAuth } = get();
				if (!userAuth) return;
				set({ userAuth: { ...userAuth, tenantId } });
			},

			clearTokens: () =>
				set({
					accessToken: null,
					refreshToken: null,
					accessTokenExpiresAt: null,
					userAuth: null,
				}),

			getAccessToken: () => get().accessToken,

			shouldRefreshAccessToken: () => {
				const { accessTokenExpiresAt } = get();
				if (!accessTokenExpiresAt) return false;
				return (
					Date.now() >=
					accessTokenExpiresAt - ACCESS_TOKEN_EXPIRY_BUFFER_SEC * 1000
				);
			},
		}),
		{
			name: "auth-store",
			partialize: (state) => ({
				accessToken: state.accessToken,
				refreshToken: state.refreshToken,
				accessTokenExpiresAt: state.accessTokenExpiresAt,
				userAuth: state.userAuth,
			}),
		}
	)
);

// Derived selector for components (Zustand persist rehydrates async, so use getState in api)
export const isAuthenticatedSelector = (state: AuthState) => !!state.accessToken;
