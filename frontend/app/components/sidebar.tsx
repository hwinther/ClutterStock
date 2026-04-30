export function SidebarGroup({ title, onAdd, children }: {
  title: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        padding: "0 14px 6px", fontSize: 10, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--c-fg-3)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span className="sidebar-group-title">{title}</span>
        {onAdd && (
          <button onClick={onAdd} title="New room" style={{
            border: "none", background: "transparent", color: "var(--c-fg-3)",
            fontSize: 14, lineHeight: 1, cursor: "pointer", padding: "0 2px",
            fontFamily: "inherit", borderRadius: 3,
          }}>＋</button>
        )}
      </div>
      {children}
    </div>
  );
}

export function SidebarRow({ label, count, active, dot, onClick }: {
  label: string;
  count: number;
  active: boolean;
  dot?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={active ? "sidebar-row-active" : undefined}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "5px 14px", fontSize: 13,
        color: active ? "var(--c-fg)" : "var(--c-fg-2)",
        background: active ? "var(--c-accent-bg)" : "transparent",
        borderLeft: `2px solid ${active ? "var(--c-accent)" : "transparent"}`,
        fontFamily: "inherit",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {dot && (
          <span style={{
            width: 6, height: 6, borderRadius: 2,
            background: "var(--c-accent)", opacity: 0.6, flexShrink: 0,
          }} />
        )}
        {label}
      </span>
      <span style={{ fontSize: 11, color: "var(--c-fg-3)", fontVariantNumeric: "tabular-nums" }}>
        {count}
      </span>
    </button>
  );
}
