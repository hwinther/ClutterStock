import type { Route } from "./+types/csp-report";
import { emitCspReports, MAX_REPORT_BYTES, parseCspReports } from "~/lib/csp-report.server";

/**
 * Receives Content-Security-Policy violation reports from browsers (see security-headers.server.ts)
 * and logs them via OpenTelemetry. Public by necessity: a report arrives without a session. It
 * always answers 204, and drops oversized or malformed bodies.
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_REPORT_BYTES) return new Response(null, { status: 204 });

  const body = await request.text();
  if (body.length <= MAX_REPORT_BYTES) {
    emitCspReports(parseCspReports(body), request.headers.get("user-agent"));
  }
  return new Response(null, { status: 204 });
}

export function loader() {
  return new Response(null, { status: 405 });
}
