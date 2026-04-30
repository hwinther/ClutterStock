import { expect, test as base } from "@playwright/test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export { expect };

const sessionFile = fileURLToPath(
  new URL("../playwright/.auth/session-storage.json", import.meta.url),
);

export const test = base.extend({
  page: async ({ page }, use) => {
    if (fs.existsSync(sessionFile)) {
      const stored: Record<string, Record<string, string>> = JSON.parse(
        fs.readFileSync(sessionFile, "utf8"),
      );
      // Runs before every navigation; only populates sessionStorage for the matching origin.
      await page.addInitScript((data: Record<string, Record<string, string>>) => {
        const entries = data[window.location.origin];
        if (entries) {
          for (const [key, value] of Object.entries(entries)) {
            sessionStorage.setItem(key, value);
          }
        }
      }, stored);
    }
    await use(page);
  },
});
