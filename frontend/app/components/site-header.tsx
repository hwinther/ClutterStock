import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useNavigate, useRouteLoaderData } from "react-router";
import type { SessionUser } from "~/lib/session.server";
import { UserModal } from "./user-modal";
import { TuiUserPanel } from "./tui-user-panel";
import { useTheme } from "~/lib/theme";

type ThemeId = "system" | "tui" | "win98" | "cde";
const THEMES: ThemeId[] = ["system", "tui", "win98", "cde"];
const THEME_LABELS: Record<ThemeId, string> = {
  system: "SYS",
  tui:    "TUI",
  win98:  "W98",
  cde:    "CDE",
};
const STORAGE_KEY = "cs-theme";

function applyTheme(t: ThemeId) {
  if (t === "system") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem(STORAGE_KEY);
  } else {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE_KEY, t);
  }
}

export function SiteHeader() {
  const rootData = useRouteLoaderData("root") as { user: SessionUser | null } | undefined;
  const user = rootData?.user ?? null;

  // useSyncExternalStore returns false on server, true on client — no effect needed
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [modalOpen, setModalOpen] = useState(false);
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (stored && THEMES.includes(stored)) return stored;
    } catch { /* ignore */ }
    return "system";
  });
  const navigate = useNavigate();
  const activeTheme = useTheme();
  const isTui = activeTheme === "tui";

  // Re-apply the stored theme on mount in case hydration stripped the
  // data-theme attribute that the pre-paint script set on <html>.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? "system";
    setThemeState(next);
    applyTheme(next);
  }

  function handleSignIn() {
    navigate("/auth/signin");
  }

  function handleSignOut() {
    setModalOpen(false);
    navigate("/auth/signout");
  }

  const displayName = user?.name ?? user?.preferred_username;
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
            <div className="modern-logo" style={{
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
            <span className="modern-logo" style={{ fontSize: 13, fontWeight: 600, color: "var(--c-fg)" }}>
              ClutterStock
            </span>
            <span className="tui-brand" style={{ fontSize: 13, color: "var(--c-fg)", fontFamily: "inherit" }}>
              ╭─[ <strong>clutterstock</strong> ]─
            </span>
            <span className="cde-brand" style={{ fontWeight: 700, fontSize: 12, color: "var(--c-fg)" }}>
              ClutterStock — Home
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 32 }}>
          {mounted && (
            <span className="tui-brand" style={{ fontSize: 11, color: "var(--c-fg-2)", fontFamily: "inherit" }}>
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme} — click to cycle`}
            className="theme-toggle"
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 11,
              padding: "3px 8px",
              border: "1px solid var(--c-border)",
              background: "transparent",
              color: "var(--c-fg-3)",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            [{THEME_LABELS[theme]}]<span className="tui-cursor">▌</span>
          </button>

          {mounted && (
            user ? (
              <>
                {/* Modern avatar pill — hidden under TUI via .modern-user CSS swap */}
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="modern-user"
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
                {/* TUI chip — shown only under TUI via .tui-user CSS swap */}
                <button
                  type="button"
                  onClick={() => setModalOpen(o => !o)}
                  className="tui-user tui-user-chip"
                  aria-label="Account"
                >
                  <span className="cs-tui-topbar-bracket">[ </span>
                  <span className="tui-user-chip-name">{displayName}</span>
                  <span className="tui-cursor">▌</span>
                  <span className="cs-tui-topbar-bracket"> ]</span>
                </button>
              </>
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
          <div className="win98-wincontrols">
            {["_", "□", "✕"].map(c => (
              <button key={c} className="win98-wincontrol">{c}</button>
            ))}
          </div>
          <div className="cde-wincontrols">
            {["_", "□"].map(c => (
              <button key={c} className="cde-wincontrol" type="button">{c}</button>
            ))}
          </div>
        </div>
      </header>

      {user && (
        <>
          <UserModal
            user={user}
            open={modalOpen && !isTui}
            onClose={() => setModalOpen(false)}
            onSignOut={handleSignOut}
          />
          <TuiUserPanel
            user={user}
            open={modalOpen && isTui}
            onClose={() => setModalOpen(false)}
            onSignOut={handleSignOut}
          />
        </>
      )}
    </>
  );
}
