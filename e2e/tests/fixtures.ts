import { expect, mergeTests, test as base } from "@playwright/test";
import { coverageTest, guardsTest } from "@wshno/playwright-config";
import fs from "node:fs";
import { sessionFile } from "./auth-paths";
import { HomePage } from "./pages/home-page";

export { expect };

interface Fixtures {
  home: HomePage;
}

const appTest = base.extend<Fixtures>({
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
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});

// guardsTest (@wshno/playwright-config) fails a spec in which the page breaks its CSP, logs a
// console error or warning, throws uncaught, or gets a 4xx/5xx or network error. coverageTest records
// the page's V8 coverage for monocartReporter() in CI (playwright.config.ts); the perf spec turns it
// off, since Lighthouse uses the same V8 coverage interface.
export const test = mergeTests(appTest, guardsTest, coverageTest);
