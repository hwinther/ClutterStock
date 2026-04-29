import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { User } from "oidc-client-ts";
import { UserModal } from "./user-modal";

export function SiteHeader() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;

    async function init() {
      const { getUserManager } = await import("~/auth/oidcClient");
      const mgr = getUserManager();

      const current = await mgr.getUser();
      if (!cancelled) setUser(current && !current.expired ? current : null);

      mgr.events.addUserLoaded((u) => { if (!cancelled) setUser(u); });
      mgr.events.addUserUnloaded(() => { if (!cancelled) setUser(null); });
      mgr.events.addUserSignedOut(() => { if (!cancelled) setUser(null); });
    }

    init();
    return () => { cancelled = true; };
  }, []);

  async function handleSignIn() {
    const { getUserManager } = await import("~/auth/oidcClient");
    await getUserManager().signinRedirect({ state: window.location.pathname + window.location.search });
  }

  async function handleSignOut() {
    const { getUserManager } = await import("~/auth/oidcClient");
    setModalOpen(false);
    await getUserManager().signoutRedirect();
  }

  const displayName = user?.profile.name ?? user?.profile.preferred_username;
  const initial = (displayName ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="text-base font-semibold text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
          >
            ClutterStock
          </Link>

          <div className="h-8 w-32">
            {mounted && (
              user ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-3 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Account"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white dark:bg-blue-500">
                    {initial}
                  </span>
                  <span className="max-w-24 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                    {displayName}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="btn-primary py-1.5"
                >
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {user && (
        <UserModal
          user={user}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </>
  );
}
