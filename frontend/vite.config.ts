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
      exclude: ["node_modules", "app/api/types.ts", "app/constants", "test/**"],
    },
    reporters: ["verbose", "github-actions", "junit", "json"],
    outputFile: {
      junit: "./coverage/junit-report.xml",
      json: "./coverage/json-report.json",
    },
  },
});
