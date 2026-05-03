import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env.test"),
});

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never" }],
        ["json", { outputFile: "playwright-report/results.json" }],
        ["allure-playwright", { resultsDir: "allure-results" }],
        [
          "monocart-reporter",
          {
            name: "ClutterStock E2E",
            outputFile: "./monocart-report/index.html",
            coverage: {
              name: "ClutterStock E2E coverage",
              // Only collect coverage for entries served by the frontend
              // container. Excludes inline data: URLs, hot-reload websockets,
              // and the OIDC redirect to auth.wsh.no.
              entryFilter: (entry: { url: string }) =>
                entry.url.includes("localhost:5173"),
              // Map bundled output back to source files via the build's
              // source maps. Keep only files under app/ — drop node_modules,
              // build artifacts, and the generated react-router types.
              sourceFilter: (sourcePath: string) =>
                /(^|\/)app\//.test(sourcePath) &&
                !/node_modules\//.test(sourcePath),
              outputDir: "./monocart-coverage",
              reports: ["v8", "cobertura", "lcov"],
            },
          },
        ],
      ]
    : "list",
  use: {
    // Use localhost (not 127.0.0.1): Vite may bind IPv6-only on Windows.
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      // signout destroys the shared Redis session, which would invalidate the
      // sid every parallel test in this project carries. Run it in its own
      // dependent project that fires after chromium finishes. Perf specs run
      // in their own project too because Lighthouse needs --remote-debugging-port.
      testIgnore: [/signout\.spec\.ts/, /perf\..*\.spec\.ts/],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "signout",
      testMatch: /signout\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["chromium"],
    },
    {
      name: "perf",
      testMatch: /perf\..*\.spec\.ts/,
      // Lighthouse connects to the Playwright Chromium instance via CDP on a
      // fixed debug port. Multiple parallel workers would race on this port,
      // so perf specs use mode: "serial" inside each file and there's only
      // one perf file today. If you add more, audit them serially or assign
      // unique ports per worker.
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
        launchOptions: {
          args: ["--remote-debugging-port=9222"],
        },
      },
      dependencies: ["setup"],
    },
  ],
  // webServer: {
  //   command: "npm run dev",
  //   url: "http://localhost:5173",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
