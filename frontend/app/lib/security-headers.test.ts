import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyDocumentCsp,
  applySecurityHeaders,
  contentSecurityPolicy,
  createNonce,
} from "./security-headers.server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("contentSecurityPolicy", () => {
  it("allows scripts only from the site and with the nonce", () => {
    const policy = contentSecurityPolicy("abc123");
    expect(policy).toContain("script-src 'self' 'nonce-abc123'");
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("report-uri /csp-report");
  });
});

describe("createNonce", () => {
  it("is fresh for every call", () => {
    expect(createNonce()).not.toBe(createNonce());
    expect(createNonce()).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});

describe("applyDocumentCsp", () => {
  it("is Report-Only unless CSP_MODE=enforce", () => {
    vi.stubEnv("NODE_ENV", "production");
    const reportOnly = new Headers();
    applyDocumentCsp(reportOnly, "n");
    expect(reportOnly.get("content-security-policy-report-only")).toContain("'nonce-n'");
    expect(reportOnly.get("content-security-policy")).toBeNull();
    expect(reportOnly.get("reporting-endpoints")).toBe('csp="/csp-report"');

    vi.stubEnv("CSP_MODE", "enforce");
    const enforced = new Headers();
    applyDocumentCsp(enforced, "n");
    expect(enforced.get("content-security-policy")).toContain("'nonce-n'");
    expect(enforced.get("content-security-policy-report-only")).toBeNull();
  });

  it("sets nothing outside production, where Vite injects inline scripts", () => {
    vi.stubEnv("NODE_ENV", "development");
    const headers = new Headers();
    applyDocumentCsp(headers, "n");
    expect([...headers.keys()]).toEqual([]);
  });
});

describe("applySecurityHeaders", () => {
  it("sets the non-CSP security headers", () => {
    const headers = new Headers();
    applySecurityHeaders(headers);
    expect(Object.fromEntries(headers)).toEqual({
      "cross-origin-opener-policy": "same-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      "referrer-policy": "strict-origin-when-cross-origin",
      "strict-transport-security": "max-age=31536000",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
    });
  });
});
