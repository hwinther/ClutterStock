import { randomBytes } from "node:crypto";

/** The path browsers POST CSP violation reports to (routes/csp-report.tsx). */
export const CSP_REPORT_PATH = "/csp-report";

export function createNonce(): string {
  return randomBytes(16).toString("base64");
}

/**
 * The Content-Security-Policy for HTML documents.
 *
 * - Scripts: same origin, plus inline scripts carrying this request's nonce (React Router's hydration
 *   data and module loader, React's streaming scripts, and the theme and runtime-config scripts in
 *   root.tsx). No 'unsafe-inline' and no 'unsafe-eval'.
 * - Styles: same origin and the Google Fonts stylesheet. style-src-attr allows inline style
 *   attributes: SSR renders React's `style` props as attributes, and the components use them widely.
 *   Inline <style> elements stay blocked.
 * - Fonts: same origin and Google Fonts. Everything the browser fetches (OTLP traces, SSE, the API)
 *   is same origin.
 * - Reports go to CSP_REPORT_PATH, via report-to (Chromium) and report-uri (Firefox).
 */
export function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `report-uri ${CSP_REPORT_PATH}`,
    "report-to csp",
  ].join("; ");
}

/**
 * `report-only` (default) sends the policy as Content-Security-Policy-Report-Only: violations are
 * reported, nothing is blocked. `enforce` sends it as Content-Security-Policy. Set by CSP_MODE.
 */
export function cspMode(): "enforce" | "report-only" {
  return process.env.CSP_MODE?.trim() === "enforce" ? "enforce" : "report-only";
}

/** Headers for every response the SSR server renders: documents and data requests. */
export function applySecurityHeaders(headers: Headers): void {
  // Not includeSubDomains: that would force HTTPS on every *.wsh.no name.
  headers.set("Strict-Transport-Security", "max-age=31536000");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
}

/**
 * Adds the CSP to an HTML document response. Only in production builds: the Vite dev server injects
 * inline scripts without a nonce.
 */
export function applyDocumentCsp(headers: Headers, nonce: string): void {
  if (process.env.NODE_ENV !== "production") return;
  const name =
    cspMode() === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
  headers.set(name, contentSecurityPolicy(nonce));
  headers.set("Reporting-Endpoints", `csp="${CSP_REPORT_PATH}"`);
}
