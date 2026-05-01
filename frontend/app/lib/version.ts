export function getVersionLine(): { line: string; sha: string } {
  const version = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "";
  const sha = (import.meta.env.VITE_GIT_SHA as string | undefined) ?? "";
  const parts: string[] = [];
  if (version) parts.push(version);
  if (sha) parts.push(sha.slice(0, 7));
  const line = parts.length > 0 ? parts.join(" · ") : import.meta.env.DEV ? "dev" : "";
  return { line, sha };
}
