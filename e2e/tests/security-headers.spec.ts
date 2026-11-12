import { parseCsp } from "@wshno/playwright-config";
import { appUrl } from "./app-url";
import { expect, test } from "./fixtures";

// frontend/app/lib/security-headers.server.ts. The policy is enforced in every environment, the e2e
// stack and the nightly preview included, so a Report-Only header here is a regression.
const cspHeader = "content-security-policy";

const expected = {
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

test.describe("security headers", () => {
  test("documents carry the headers and a per-request nonce", async ({ request }) => {
    const first = (await request.get("/")).headers();
    const second = (await request.get("/")).headers();
    expect(first).toMatchObject(expected);
    expect(first["reporting-endpoints"]).toBe('csp="/csp-report"');
    expect(first["content-security-policy-report-only"]).toBeUndefined();

    const nonce = (headers: Record<string, string>) =>
      parseCsp(headers[cspHeader])[0]
        ?.get("script-src")
        ?.find((source) => source.startsWith("'nonce-"));
    expect(nonce(first)).toBeTruthy();
    expect(nonce(first)).not.toBe(nonce(second));
  });

  test("the policy keeps scripts to the site and the nonce", async ({ request }) => {
    const [policy] = parseCsp((await request.get("/")).headers()[cspHeader]);
    expect(policy?.get("default-src")).toEqual(["'self'"]);
    expect(policy?.get("script-src")?.filter((s) => !s.startsWith("'nonce-"))).toEqual(["'self'"]);
    expect(policy?.get("object-src")).toEqual(["'none'"]);
    expect(policy?.get("base-uri")).toEqual(["'none'"]);
    expect(policy?.get("frame-ancestors")).toEqual(["'none'"]);
    expect(policy?.get("report-uri")).toEqual(["/csp-report"]);
  });

  test("every inline script in the page carries the header's nonce", async ({ home }) => {
    const response = await home.page.goto("/");
    const [policy] = parseCsp(response?.headers()[cspHeader]);
    const nonce = policy?.get("script-src")?.find((s) => s.startsWith("'nonce-"))?.slice(7, -1);

    // Browsers hide the nonce attribute from the DOM; the nonce property still has it.
    const inline = await home.page.locator("script:not([src])").evaluateAll((scripts) =>
      scripts.map((script) => (script as HTMLScriptElement).nonce),
    );
    expect(inline.length).toBeGreaterThan(0);
    expect(new Set(inline)).toEqual(new Set([nonce]));
  });

  test.describe("in the browser", () => {
    test.use({ cspGuard: { mode: "warn" } });

    test("an injected inline script is blocked and reported", async ({ cspViolations, home }) => {
      await home.goto();
      const ran = await home.page.evaluate(() => {
        const script = document.createElement("script");
        script.textContent = "window.__injected = true";
        document.body.append(script);
        return "__injected" in window;
      });
      expect(ran).toBe(false);
      await expect
        .poll(() => cspViolations.map((v) => `${v.disposition} ${v.effectiveDirective}`))
        .toEqual(["enforce script-src-elem"]);
    });
  });
});

test.describe("CSP report endpoint", () => {
  test("accepts report-uri and report-to bodies", async ({ request }) => {
    const reportUri = await request.post("/csp-report", {
      headers: { "content-type": "application/csp-report" },
      data: JSON.stringify({
        "csp-report": {
          "blocked-uri": "inline",
          disposition: "report",
          "document-uri": appUrl.href,
          "effective-directive": "script-src-elem",
        },
      }),
    });
    expect(reportUri.status()).toBe(204);

    const reportTo = await request.post("/csp-report", {
      headers: { "content-type": "application/reports+json" },
      data: JSON.stringify([
        {
          type: "csp-violation",
          body: {
            blockedURL: "inline",
            disposition: "report",
            documentURL: appUrl.href,
            effectiveDirective: "script-src-elem",
          },
        },
      ]),
    });
    expect(reportTo.status()).toBe(204);
  });

  // @local-only: a deployed env sits behind the NAXSI edge, which rejects a body that isn't valid
  // JSON (rule 15) before the app sees it.
  test("answers 204 to a malformed body", { tag: "@local-only" }, async ({ request }) => {
    const malformed = await request.post("/csp-report", {
      headers: { "content-type": "application/csp-report" },
      data: "{not json",
    });
    expect(malformed.status()).toBe(204);
  });

  test("answers 405 to a GET", async ({ request }) => {
    expect((await request.get("/csp-report")).status()).toBe(405);
  });
});
