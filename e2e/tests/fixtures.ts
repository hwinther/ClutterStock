import { expect, test as base } from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";
import fs from "node:fs";
import { sessionFile } from "./auth-paths";
import { HomePage } from "./pages/home-page";

export { expect };

interface Fixtures {
  home: HomePage;
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use, testInfo) => {
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
    // Browser-side V8 coverage is only collected in CI — locally the start/stop
    // roundtrip and the per-test attachment add overhead nobody asked for
    // during `npx playwright test --ui`. Skip the perf project too: Lighthouse
    // uses the same V8 coverage interface, and concurrent calls fight.
    const collectCoverage =
      !!process.env.CI && testInfo.project.name !== "perf";
    if (collectCoverage) {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
    }
    await use(page);
    if (collectCoverage) {
      const coverage = await page.coverage.stopJSCoverage();
      await addCoverageReport(coverage, testInfo);
    }
  },
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
});
