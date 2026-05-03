import fs from "node:fs";
import path from "node:path";
import type { BrowserContext, Page } from "playwright";

// Paths resolve from process.cwd() — `npm run load` and the CI workflow both
// run artillery from frontend/, so this lands at frontend/playwright/.auth/.
// We can't use import.meta.url here: Artillery's built-in TS bundler emits
// CommonJS, and import.meta is empty in that output. Mirror these constants
// against frontend/e2e/auth-paths.ts when those move.
const authFile = path.resolve("playwright/.auth/user.json");
const sessionFile = path.resolve("playwright/.auth/session-storage.json");

interface StorageState {
  cookies?: Parameters<BrowserContext["addCookies"]>[0];
  origins?: Array<{
    origin: string;
    localStorage?: Array<{ name: string; value: string }>;
  }>;
}

let cached: { storage: StorageState; session: Record<string, Record<string, string>> } | null = null;

function load(): NonNullable<typeof cached> {
  if (cached) return cached;
  if (!fs.existsSync(authFile)) {
    throw new Error(
      `Cached auth state not found at ${authFile}. Run \`npx playwright test --project=setup\` first.`,
    );
  }
  const storage: StorageState = JSON.parse(fs.readFileSync(authFile, "utf8"));
  const session: Record<string, Record<string, string>> = fs.existsSync(sessionFile)
    ? JSON.parse(fs.readFileSync(sessionFile, "utf8"))
    : {};
  cached = { storage, session };
  return cached;
}

// Apply cookies + localStorage + sessionStorage to a fresh Playwright context.
// Artillery's playwright engine creates a new context per VU, so this runs once
// per VU. The sessionStorage init script mirrors fixtures.ts — Playwright's
// storageState round-trip captures localStorage but not sessionStorage, and
// the OIDC user object lives there.
export async function applyAuth(page: Page): Promise<void> {
  const { storage, session } = load();
  const context = page.context();

  if (storage.cookies?.length) {
    await context.addCookies(storage.cookies);
  }

  if (storage.origins?.length) {
    await context.addInitScript((origins: NonNullable<StorageState["origins"]>) => {
      const match = origins.find(o => o.origin === window.location.origin);
      if (!match?.localStorage) return;
      for (const { name, value } of match.localStorage) {
        try {
          localStorage.setItem(name, value);
        } catch {
          // localStorage may be unavailable in some contexts — ignore.
        }
      }
    }, storage.origins);
  }

  if (Object.keys(session).length > 0) {
    await context.addInitScript((data: Record<string, Record<string, string>>) => {
      const entries = data[window.location.origin];
      if (!entries) return;
      for (const [key, value] of Object.entries(entries)) {
        sessionStorage.setItem(key, value);
      }
    }, session);
  }
}
