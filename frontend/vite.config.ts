import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  // Source maps in the production build let monocart-reporter map browser-side
  // V8 coverage from the minified bundles back to app/* source files. Adds
  // ~10MB to the image but the bundle URLs are already viewable in DevTools,
  // so no additional disclosure beyond what's already reachable.
  build: {
    sourcemap: true,
  },
  plugins: [
    tailwindcss(),
    ...(process.env.VITEST ? [] : [reactRouter()]),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./app/test/setup.ts"],
    include: ["app/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["coverage/**"],
    coverage: {
      enabled: true,
      provider: "v8",
      reporter: ["cobertura", "lcov", "html", "json"],
      // Every source file counts, not only the ones a test imports (Vitest's default), so an untested
      // file shows up as 0 %. Unit tests own the logic (components, features, lib, the API client);
      // routes and layouts are the e2e suite's, which measures them (e2e/playwright.config.ts leaves
      // out the rest of this list too). Also left out: openapi-typescript's generated types,
      // constants, bootstrapping, OTel setup, the test helpers and the template's welcome page.
      include: ["app/**/*.{ts,tsx}"],
      exclude: [
        "app/**/*.{test,spec}.{ts,tsx}",
        "app/**/*.d.ts",
        "app/api/types.ts",
        "app/constants/**",
        "app/entry.*",
        "app/root.tsx",
        "app/routes.ts",
        "app/otel/**",
        "app/test/**",
        "app/welcome/**",
        "app/routes/**",
        "app/layouts/**",
      ],
    },
    reporters: ["verbose", "github-actions", "junit", "json"],
    outputFile: {
      junit: "./coverage/junit-report.xml",
      json: "./coverage/json-report.json",
    },
  },
});
