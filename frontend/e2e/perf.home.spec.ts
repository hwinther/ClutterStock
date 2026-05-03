import path from "node:path";
import { playAudit } from "playwright-lighthouse";
import { test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("home page lighthouse audit", async ({ home, page, context }, testInfo) => {
  // Establish the authenticated session in the Playwright context first.
  await home.goto();
  await home.expectAuthenticated();

  // Lighthouse opens its own page via CDP — Playwright's storageState is
  // bound to a specific context and doesn't propagate. Forward the active
  // session cookie via Lighthouse extraHeaders so the audit hits the same
  // authenticated routes the rest of the suite does.
  const cookies = await context.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  await playAudit({
    page,
    port: 9222,
    opts: {
      extraHeaders: { Cookie: cookieHeader },
    },
    // Thresholds are loose on purpose: CI runners have variable CPU/network
    // and Lighthouse scores can swing 20+ points between runs. Tighten as the
    // signal stabilises (or move perf to nightly so the noise doesn't gate PRs).
    thresholds: {
      performance: 30,
      accessibility: 70,
      "best-practices": 60,
      seo: 50,
    },
    reports: {
      formats: { html: true, json: true },
      name: "lighthouse-home",
      directory: testInfo.outputDir,
    },
  });

  // Attach the HTML report so monocart-reporter can surface it inline alongside
  // the test row. The report path follows playwright-lighthouse's naming
  // convention: <directory>/<name>.report.html.
  await testInfo.attach("lighthouse-home", {
    path: path.join(testInfo.outputDir, "lighthouse-home.report.html"),
    contentType: "text/html",
  });
});
