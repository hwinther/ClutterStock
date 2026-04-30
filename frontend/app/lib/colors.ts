export const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  Furniture:   { bg: "rgba(91,91,245,0.10)",  fg: "#5b5bf5" },
  Electronics: { bg: "rgba(34,197,94,0.10)",  fg: "#16a34a" },
  Textiles:    { bg: "rgba(244,114,182,0.10)", fg: "#db2777" },
  Cookware:    { bg: "rgba(249,115,22,0.10)",  fg: "#ea580c" },
  Appliances:  { bg: "rgba(239,68,68,0.10)",   fg: "#dc2626" },
  Lighting:    { bg: "rgba(234,179,8,0.10)",   fg: "#ca8a04" },
  Decor:       { bg: "rgba(168,85,247,0.10)",  fg: "#9333ea" },
  Plants:      { bg: "rgba(34,197,94,0.10)",   fg: "#16a34a" },
  Tableware:   { bg: "rgba(20,184,166,0.10)",  fg: "#0d9488" },
  Sports:      { bg: "rgba(14,165,233,0.10)",  fg: "#0284c7" },
  Media:       { bg: "rgba(168,85,247,0.10)",  fg: "#9333ea" },
  Seasonal:    { bg: "rgba(234,179,8,0.10)",   fg: "#ca8a04" },
  Travel:      { bg: "rgba(14,165,233,0.10)",  fg: "#0284c7" },
};

export function nameHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return h % 360;
}
