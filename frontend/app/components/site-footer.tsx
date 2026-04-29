export function SiteFooter() {
  const version = import.meta.env.VITE_APP_VERSION ?? "";
  const sha = import.meta.env.VITE_GIT_SHA ?? "";
  const parts: string[] = [];
  if (version) parts.push(version);
  if (sha) parts.push(sha.slice(0, 7));

  const line = parts.length > 0 ? parts.join(" · ") : import.meta.env.DEV ? "dev" : "";
  if (!line) return null;

  return (
    <footer style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 16px",
      height: 26,
      borderTop: "1px solid var(--c-border)",
      background: "var(--c-bg-2)",
      fontSize: 11,
      color: "var(--c-fg-3)",
      fontFamily: "ui-monospace, monospace",
      flexShrink: 0,
    }}>
      <span title={sha.length > 0 ? sha : undefined}>{line}</span>
    </footer>
  );
}
