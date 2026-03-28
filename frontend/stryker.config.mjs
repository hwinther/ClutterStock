// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  reporters: ["progress", "clear-text", "html", "json"],
  coverageAnalysis: "perTest",
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  typescriptChecker: {
    prioritizePerformanceOverAccuracy: true,
  },
  mutate: ["app/**/*.{ts,tsx}"],
  // testFiles: ["app/**/*.{test,spec}.{ts,tsx}"],
  vitest: {
    configFile: "vite.config.ts",
    related: false,
  },
};
export default config;
