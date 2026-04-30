import { UserManager, WebStorageStateStore } from "oidc-client-ts";

// oidc-client-ts v3 defaults userStore to localStorage; we override to sessionStorage so
// tokens are not shared across tabs and are cleared when the browser session ends.
const sessionStore = () => new WebStorageStateStore({ store: window.sessionStorage });

export const AUTH_COOKIE = "clutterstock_auth";

function setAuthCookie(token: string, expiresAt: number): void {
  const expires = new Date(expiresAt * 1000).toUTCString();
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
}

function clearAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

let _manager: UserManager | undefined;

export function getUserManager(): UserManager {
  if (!_manager) {
    _manager = new UserManager({
      authority: import.meta.env.VITE_OIDC_AUTHORITY ?? "",
      client_id: import.meta.env.VITE_OIDC_CLIENT_ID ?? "",
      redirect_uri: `${window.location.origin}/auth/callback`,
      scope: "openid profile email groups offline_access",
      response_type: "code",
      automaticSilentRenew: true,
      loadUserInfo: true,
      userStore: sessionStore(),
    });

    _manager.events.addUserLoaded((user) => {
      if (user.expires_at) setAuthCookie(user.access_token, user.expires_at);
    });

    _manager.events.addUserUnloaded(clearAuthCookie);
    _manager.events.addUserSignedOut(clearAuthCookie);
  }
  return _manager;
}

export async function initAuth(): Promise<void> {
  const mgr = getUserManager();
  const user = await mgr.getUser();
  if (user && !user.expired && user.expires_at) {
    setAuthCookie(user.access_token, user.expires_at);
  }
}
