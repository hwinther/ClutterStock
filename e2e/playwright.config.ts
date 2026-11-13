import { devices } from "@playwright/test";
import {
  allureReporter,
  ciReporters,
  definePlaywrightConfig,
  isCI,
  localReporters,
  monocartReporter,
} from "@wshno/playwright-config";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authFile } from "./tests/auth-paths";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env.test"),
});

// Use localhost (not 127.0.0.1): Vite may bind IPv6-only on Windows. BASE_URL points the suite at a
// deployed env instead (the nightly preview).
const baseURL = process.env.BASE_URL ?? "http://localhost:5173";

// Shared defaults (testDir ./tests, retries, forbidOnly, the github/html/json CI reporters, trace,
// screenshot and video on failure) come from @wshno/playwright-config; only what differs is set here.
export default definePlaywrightConfig({
  reporter: isCI
    ? [
        ...ciReporters,
        allureReporter(),
        // V8 coverage of the frontend's bundles, mapped back through its source maps to
        // frontend/app/** (the same repo-relative paths as the unit tests' Cobertura), so
        // quality-e2e and e2e-coverage-summary can merge the two. Only scripts served by the
        // frontend count: not data: URLs, hot-reload sockets or the OIDC redirect to auth.wsh.no.
        // Recorded by the page fixture in tests/fixtures.ts.
        monocartReporter({
          name: "ClutterStock E2E",
          coverage: {
            name: "ClutterStock E2E coverage",
            origin: baseURL,
            // The same files as the unit coverage (frontend/vite.config.ts), routes and layouts
            // included: those are this suite's to cover. Also out: health/debug/CSP-report routes.
            layout: {
              root: "frontend",
              sourceDirs: ["app"],
              exclude:
                /^frontend\/app\/(api\/types\.ts$|constants\/|entry\.|root\.tsx$|routes\.ts$|otel\/|test\/|welcome\/|routes\/(healthz|debug\.|csp-report))/,
            },
          },
        }),
      ]
    : localReporters,
  use: {
    baseURL,
  },
  // Against a deployed env, skip what only holds for the app itself (e.g. bodies the NAXSI edge
  // rejects before they reach it).
  grepInvert: process.env.BASE_URL ? /@local-only/ : undefined,
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
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
    {
      name: "signout",
      testMatch: /signout\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
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
        storageState: authFile,
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
