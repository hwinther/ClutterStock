import { describe, expect, it } from "vitest";
import { parseCspReports } from "./csp-report.server";

describe("parseCspReports", () => {
  it("reads a report-uri body (Firefox)", () => {
    const body = JSON.stringify({
      "csp-report": {
        "blocked-uri": "inline",
        "column-number": 7,
        disposition: "report",
        "document-uri": "https://clutterstock.test/locations?id=1",
        "effective-directive": "script-src-elem",
        "line-number": 12,
        "original-policy": "script-src 'self'",
        "script-sample": "alert(1)",
        "source-file": "https://clutterstock.test/locations",
      },
    });
    expect(parseCspReports(body)).toEqual([
      {
        blockedUri: "inline",
        columnNumber: 7,
        disposition: "report",
        documentUri: "https://clutterstock.test/locations",
        effectiveDirective: "script-src-elem",
        lineNumber: 12,
        sample: "alert(1)",
        sourceFile: "https://clutterstock.test/locations",
      },
    ]);
  });

  it("reads a report-to body (Chromium) and skips other report types", () => {
    const body = JSON.stringify([
      {
        type: "csp-violation",
        body: {
          blockedURL: "https://evil.test/x.js?token=secret",
          disposition: "enforce",
          documentURL: "https://clutterstock.test/",
          effectiveDirective: "script-src-elem",
        },
      },
      { type: "deprecation", body: { id: "x" } },
    ]);
    expect(parseCspReports(body)).toEqual([
      {
        blockedUri: "https://evil.test/x.js",
        disposition: "enforce",
        documentUri: "https://clutterstock.test/",
        effectiveDirective: "script-src-elem",
      },
    ]);
  });

  it("drops query strings, which can carry tokens", () => {
    const [report] = parseCspReports(
      JSON.stringify({
        "csp-report": {
          "document-uri": "https://clutterstock.test/auth/callback?code=abc&state=def",
          "effective-directive": "img-src",
          "blocked-uri": "https://cdn.test/a.png#frag",
        },
      }),
    );
    expect(report?.documentUri).toBe("https://clutterstock.test/auth/callback");
    expect(report?.blockedUri).toBe("https://cdn.test/a.png");
  });

  it("truncates long strings and caps the number of reports", () => {
    const long = "x".repeat(2000);
    const many = Array.from({ length: 50 }, () => ({
      type: "csp-violation",
      body: { documentURL: "https://clutterstock.test/", effectiveDirective: "img-src", sample: long },
    }));
    const reports = parseCspReports(JSON.stringify(many));
    expect(reports).toHaveLength(20);
    expect(reports[0]?.sample?.length).toBe(513);
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["an unrelated object", JSON.stringify({ hello: "world" })],
    ["a report without a directive", JSON.stringify({ "csp-report": { "document-uri": "https://x.test/" } })],
    ["a non-string field", JSON.stringify({ "csp-report": { "document-uri": 1, "effective-directive": "img-src" } })],
  ])("yields nothing for %s", (_label, body) => {
    expect(parseCspReports(body)).toEqual([]);
  });
});
