import { useEffect, useRef } from "react";
import type { User } from "oidc-client-ts";

interface Props {
  user: User;
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export function UserModal({ user, open, onClose, onSignOut }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  const { profile } = user;
  const groups = Array.isArray((profile as Record<string, unknown>).groups)
    ? ((profile as Record<string, unknown>).groups as string[])
    : [];

  const displayName = profile.name ?? profile.preferred_username ?? profile.sub;
  const username = profile.preferred_username;
  const email = profile.email;
  const initial = (displayName ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      style={{
        width: "100%",
        maxWidth: 360,
        padding: 0,
        border: "1px solid var(--c-border)",
        borderRadius: 10,
        background: "var(--c-bg-2)",
        color: "var(--c-fg)",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--c-border-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: "var(--c-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--c-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayName}
              </div>
              {username && displayName !== username && (
                <div style={{ fontSize: 12, color: "var(--c-fg-3)", marginTop: 2 }}>@{username}</div>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 0 }}>
          {email && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--c-border-2)", fontSize: 13 }}>
              <span style={{ color: "var(--c-fg-3)" }}>Email</span>
              <span style={{ color: "var(--c-fg)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{email}</span>
            </div>
          )}
          {groups.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "7px 0", fontSize: 13 }}>
              <span style={{ color: "var(--c-fg-3)", paddingTop: 2 }}>Groups</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "flex-end", maxWidth: 200 }}>
                {groups.map((g) => (
                  <span key={g} style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "var(--c-accent-bg)",
                    color: "var(--c-accent)",
                    fontWeight: 500,
                  }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: "12px 20px 16px", borderTop: "1px solid var(--c-border-2)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} className="btn-secondary">Close</button>
          <button type="button" onClick={onSignOut} className="btn-danger">Sign out</button>
        </div>
      </div>
    </dialog>
  );
}
