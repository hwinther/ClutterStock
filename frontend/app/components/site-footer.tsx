import { getVersionLine } from "~/lib/version";

export function SiteFooter() {
  const { line, sha } = getVersionLine();
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
