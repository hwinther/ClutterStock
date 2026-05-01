import { useEffect, useRef } from "react";
import type { SessionUser } from "~/lib/session.server";

export function TuiUserPanel({ user, open, onClose, onSignOut }: {
  user: SessionUser;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocPointer(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "s") {
        // Only fire when focus is inside the panel (avoid hijacking 's' globally)
        if (ref.current?.contains(document.activeElement)) {
          e.preventDefault();
          onSignOut();
        }
      }
    }
    document.addEventListener("mousedown", onDocPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, onSignOut]);

  // Focus first action button when opened, so 's' / Esc work without an extra click
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open]);

  if (!open) return null;

  const displayName = user.name ?? user.preferred_username ?? user.sub;
  const username    = user.preferred_username ?? "";
  const email       = user.email ?? "";
  const groups      = (user.groups ?? []).filter(Boolean);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-label="Account"
      className="tui-panel tui-user-panel"
    >
      <span className="tui-panel-title">{`─[ user · ${displayName} ]─`}</span>

      <div className="tui-detail-grid tui-user-panel-grid">
        <Field label="user"     value={displayName}  emphasis="bright" />
        <Field label="username" value={username || <Dim>(none)</Dim>} />
        <Field label="email"    value={email || <Dim>(none)</Dim>} />
        <Field label="groups"   value={groups.length > 0 ? groups.join(", ") : <Dim>(none)</Dim>} />
        <div className="tui-detail-field tui-user-panel-sub">
          <span className="tui-detail-label">{"sub     "}</span>
          <span className="tui-detail-colon">:</span>{" "}
          <span className="tui-detail-value tui-user-panel-sub-value" title={user.sub}>{user.sub}</span>
        </div>
      </div>

      <div className="tui-detail-actions">
        <button type="button" onClick={onSignOut} className="tui-detail-action tui-detail-action--danger">
          [s] sign out
        </button>
        <span className="tui-detail-sep">·</span>
        <button type="button" onClick={onClose} className="tui-detail-action">
          [Esc] close
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, emphasis }: {
  label: string;
  value: React.ReactNode;
  emphasis?: "bright";
}) {
  return (
    <div className="tui-detail-field">
      <span className="tui-detail-label">{label.padEnd(8, " ")}</span>
      <span className="tui-detail-colon">:</span>{" "}
      <span className={emphasis ? `tui-detail-value tui-detail-value--${emphasis}` : "tui-detail-value"}>
        {value}
      </span>
    </div>
  );
}

function Dim({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--c-fg-3)" }}>{children}</span>;
}
