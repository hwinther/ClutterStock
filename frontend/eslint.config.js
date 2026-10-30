import wshno, { testingLibrary, vitest } from "@wshno/eslint-config";

// @wshno/eslint-config: JS/TS and SonarJS recommended, @eslint-react, React Refresh and React Router,
// plus the Vitest and Testing Library presets.
/** @type {import('eslint').Linter.Config[]} */
export default [
  ...wshno,
  ...vitest(),
  ...testingLibrary(),
  { ignores: ["app/api/types.ts", "coverage/**", "test-results/**", "design-template/**"] },
];
