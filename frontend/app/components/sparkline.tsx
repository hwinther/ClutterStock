export function Sparkline({ seed }: { seed: number }) {
  const w = 56, h = 20, n = 7;
  const pts = Array.from({ length: n }, (_, i) => i).reduce<number[]>((acc, i) => {
    const prev = acc.length > 0 ? acc[acc.length - 1]! : Math.max(1, seed * 0.5);
    const noise = ((seed * (i * 13 + 7)) % 7) - 3;
    const next = Math.max(1, prev + (seed - prev) * 0.35 + noise);
    acc.push(i === n - 1 ? seed : Math.round(next));
    return acc;
  }, []);
  const max = Math.max(...pts, 1);
  const coords = pts
    .map((p, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - (p / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} style={{ flexShrink: 0, overflow: "visible" }}>
      <polyline fill="none" stroke="var(--c-accent)" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round" points={coords} opacity="0.8" />
    </svg>
  );
}
