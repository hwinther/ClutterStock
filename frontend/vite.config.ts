import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
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
