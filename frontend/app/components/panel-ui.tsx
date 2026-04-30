export function PanelHeader({ label, actions, onClose }: {
  label: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div style={{
      padding: "10px 16px", borderBottom: "1px solid var(--c-border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: "var(--c-fg-3)", fontFamily: "ui-monospace, monospace" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {actions}
        <button onClick={onClose} style={{
          border: "none", background: "transparent", color: "var(--c-fg-3)",
          fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "0 4px",
          borderRadius: 4, fontFamily: "inherit",
        }}>×</button>
      </div>
    </div>
  );
}

export function DrawerField({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 0", borderBottom: "1px solid var(--c-border-2)", fontSize: 13,
    }}>
      <span style={{ color: "var(--c-fg-3)" }}>{label}</span>
      <span style={{ color: "var(--c-fg)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: "var(--c-fg-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
