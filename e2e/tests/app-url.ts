/**
 * Where the app under test runs: BASE_URL for a deployed env (the nightly preview), otherwise the
 * local compose stack. Specs use it instead of a literal host so the same suite runs against both.
 */
export const appUrl = new URL(process.env.BASE_URL ?? "http://localhost:5173");
