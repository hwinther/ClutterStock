import { expect, test as base } from "@playwright/test";
import fs from "node:fs";
import { sessionFile } from "./auth-paths";
import { HomePage } from "./pages/home-page";

export { expect };

interface Fixtures {
  home: HomePage;
}

export const test = base.extend<Fixtures>({
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
