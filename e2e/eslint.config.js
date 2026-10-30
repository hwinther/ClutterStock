import { base, ignores, node, playwright } from "@wshno/eslint-config";

// @wshno/eslint-config: JS/TS and SonarJS recommended, Node globals, and the Playwright rules for the specs.
/** @type {import('eslint').Linter.Config[]} */
export default [
  ...ignores,
  ...base,
  ...node,
  ...playwright(["tests/**/*.ts"]),
  {
    ignores: [
      "playwright-report/**",
      "test-results/**",
      "allure-results/**",
      "allure-report/**",
      "monocart-report/**",
      "monocart-coverage/**",
      "load/scenarios/dist/**",
    ],
  },
];
