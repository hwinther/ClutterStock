export function SiteFooter() {
  const version = import.meta.env.VITE_APP_VERSION ?? "";
  const sha = import.meta.env.VITE_GIT_SHA ?? "";
  const parts: string[] = [];
  if (version) parts.push(version);
  if (sha) parts.push(sha.slice(0, 7));

  let line = "";
  if (parts.length > 0) {
    line = parts.join(" · ");
  } else if (import.meta.env.DEV) {
    line = "dev build";
  }

  if (!line) return null;

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50/80 py-3 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/40 dark:text-neutral-400">
      <p className="font-mono tabular-nums">{line}</p>
    </footer>
  );
}
