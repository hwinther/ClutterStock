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
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderBottom: "1px solid var(--c-border)",
        background: "var(--c-bg-2)",
        height: 48,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            to="/locations"
            style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "var(--c-accent)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              ▦
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-fg)" }}>
              ClutterStock
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 32 }}>
          {mounted && (
            user ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "4px 10px 4px 4px",
                  borderRadius: 999,
                  border: "1px solid var(--c-border)",
                  background: "var(--c-bg-3)",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--c-fg-2)",
                  fontWeight: 500,
                }}
                aria-label="Account"
              >
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: "var(--c-accent)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {initial}
                </span>
                <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="btn-primary"
              >
                Sign in
              </button>
            )
          )}
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
