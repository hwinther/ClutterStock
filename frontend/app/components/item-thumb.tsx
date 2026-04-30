import { useTheme } from "~/lib/theme";
import { nameHue } from "~/lib/colors";

export function ItemThumb({ name }: { name: string }) {
  const theme = useTheme();
  const hue = nameHue(name);
  if (theme === "tui") {
    return (
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        border: "1px dashed var(--c-fg-3)",
        display: "grid", placeItems: "center",
        color: "var(--c-fg-3)", fontSize: 10,
      }}>##</div>
    );
  }
  if (theme === "win98") {
    return (
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        display: "grid", placeItems: "center",
        fontSize: 16, lineHeight: 1,
      }}>📄</div>
    );
  }
  if (theme === "cde") {
    return (
      <div style={{
        width: 24, height: 24, flexShrink: 0,
        background: "#dcdad5",
        boxShadow: "inset -1px -1px 0 #cbd1dc, inset 1px 1px 0 #5b6878",
        display: "grid", placeItems: "center",
        fontSize: 13, lineHeight: 1,
      }}>▣</div>
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
      background: `linear-gradient(135deg, oklch(0.85 0.05 ${hue}), oklch(0.70 0.07 ${(hue + 40) % 360}))`,
      border: "1px solid var(--c-border)",
    }} />
  );
}
