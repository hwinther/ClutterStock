/**
 * A deliberately conspicuous banner used during demonstrations so it is
 * immediately obvious that the running build is NOT the production site.
 * Remove (or guard behind an env flag) before shipping to production.
 */
export function DemoBanner() {
  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "6px 16px",
        background: "repeating-linear-gradient(45deg, #ff8a00, #ff8a00 12px, #1a1a1a 12px, #1a1a1a 24px)",
        color: "#fff",
        fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      <span aria-hidden>⚠</span>
      <span>Demo-miljø — ikke produksjon</span>
      <span aria-hidden>⚠</span>
    </div>
  );
}
