import { logs, SeverityNumber } from "@opentelemetry/api";

/** One CSP violation, normalized from either report format. */
export interface CspReport {
  blockedUri: string;
  columnNumber?: number;
  disposition: string;
  documentUri: string;
  effectiveDirective: string;
  lineNumber?: number;
  sample?: string;
  sourceFile?: string;
}

// The endpoint is public, so a request is capped: body size, reports per request, string length.
export const MAX_REPORT_BYTES = 64 * 1024;
const MAX_REPORTS = 20;
const MAX_STRING = 512;

function text(value: unknown): string | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
}

function number(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

// Query strings and fragments can carry tokens (an OIDC callback's ?code=, say); keep only the path.
function withoutQuery(uri: string | undefined): string | undefined {
  if (!uri) return uri;
  try {
    const url = new URL(uri);
    return `${url.origin}${url.pathname}`;
  } catch {
    // Not a URL: 'inline', 'eval', 'data', a bare scheme.
    return uri;
  }
}

function normalize(raw: Record<string, unknown>): CspReport | undefined {
  // report-uri (Firefox) uses kebab-case, report-to (Chromium) camelCase.
  const effectiveDirective =
    text(raw.effectiveDirective) ?? text(raw["effective-directive"]) ?? text(raw["violated-directive"]);
  const documentUri = withoutQuery(text(raw.documentURL) ?? text(raw["document-uri"]));
  if (!effectiveDirective || !documentUri) return undefined;
  return {
    blockedUri: withoutQuery(text(raw.blockedURL) ?? text(raw["blocked-uri"])) ?? "",
    columnNumber: number(raw.columnNumber) ?? number(raw["column-number"]),
    disposition: text(raw.disposition) ?? "unknown",
    documentUri,
    effectiveDirective,
    lineNumber: number(raw.lineNumber) ?? number(raw["line-number"]),
    sample: text(raw.sample) ?? text(raw["script-sample"]),
    sourceFile: withoutQuery(text(raw.sourceFile) ?? text(raw["source-file"])),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parses a CSP report body. report-uri sends `{"csp-report": {...}}` as application/csp-report;
 * report-to sends an array of `{type: "csp-violation", body: {...}}` as application/reports+json.
 * Anything else, or malformed, yields no reports.
 */
export function parseCspReports(body: string): CspReport[] {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return [];
  }
  const raws: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    for (const entry of data) {
      if (isRecord(entry) && entry.type === "csp-violation" && isRecord(entry.body)) raws.push(entry.body);
    }
  } else if (isRecord(data) && isRecord(data["csp-report"])) {
    raws.push(data["csp-report"]);
  }
  return raws
    .slice(0, MAX_REPORTS)
    .map(normalize)
    .filter((report): report is CspReport => report !== undefined);
}

const logger = logs.getLogger("clutterstock-frontend-ssr.csp");

/** Emits each report as an OTel log record; the SSR server's OTLP exporter ships them to Loki. */
export function emitCspReports(reports: CspReport[], userAgent: string | null): void {
  for (const report of reports) {
    const attributes: Record<string, string | number> = {
      "event.name": "csp.violation",
      "csp.blocked_uri": report.blockedUri,
      "csp.disposition": report.disposition,
      "csp.document_uri": report.documentUri,
      "csp.effective_directive": report.effectiveDirective,
    };
    if (report.sourceFile) attributes["csp.source_file"] = report.sourceFile;
    if (report.lineNumber !== undefined) attributes["csp.line_number"] = report.lineNumber;
    if (report.columnNumber !== undefined) attributes["csp.column_number"] = report.columnNumber;
    if (report.sample) attributes["csp.sample"] = report.sample;
    if (userAgent) attributes["user_agent.original"] = userAgent.slice(0, MAX_STRING);
    logger.emit({
      attributes,
      body: `CSP ${report.disposition}: ${report.effectiveDirective} ${report.blockedUri || "(no URI)"} on ${report.documentUri}`,
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
    });
  }
}
