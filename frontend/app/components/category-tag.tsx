import { useTheme } from "~/lib/theme";
import { CATEGORY_COLORS } from "~/lib/colors";

export function CategoryTag({ name }: { name: string }) {
  const theme = useTheme();
  if (theme === "tui") {
    return (
      <span style={{
        fontSize: 11, padding: "1px 6px",
        border: "1px solid #ffd24d", color: "#ffd24d",
        fontFamily: "inherit", whiteSpace: "nowrap",
      }}>[{name}]</span>
    );
  }
  if (theme === "win98") {
    return <span style={{ fontSize: 11, color: "var(--c-fg)" }}>{name}</span>;
  }
  if (theme === "cde") {
    return <span style={{ fontSize: 11, color: "#3d6062", fontWeight: 700 }}>{name}</span>;
  }
  const c = CATEGORY_COLORS[name] ?? { bg: "rgba(120,120,140,0.10)", fg: "var(--c-fg-2)" };
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4,
      background: c.bg, color: c.fg, fontWeight: 500, whiteSpace: "nowrap",
    }}>
      {name}
    </span>
  );
}
