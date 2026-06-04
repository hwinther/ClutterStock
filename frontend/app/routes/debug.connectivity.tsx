import { useCallback, useEffect, useState } from "react";

import type { Route } from "./+types/debug.connectivity";
import { isDebugConfigAllowed } from "~/lib/debug-config";

export async function loader(_args: Route.LoaderArgs) {
  if (!isDebugConfigAllowed()) {
    throw new Response(null, { status: 404 });
  }
  return null;
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Debug connectivity | ClutterStock" }];
}

type Verdict = "ok" | "warn" | "fail" | "pending";

type Check = {
  label: string;
  verdict: Verdict;
  detail: string;
};

/** Friendly name for an ALPN/Resource-Timing `nextHopProtocol` token. */
function protocolLabel(token: string): { name: string; verdict: Verdict } {
  switch (token) {
    case "h3":
    case "h3-29":
      return { name: "HTTP/3 (QUIC)", verdict: "ok" };
    case "h2":
      return { name: "HTTP/2", verdict: "ok" };
    case "http/1.1":
      return { name: "HTTP/1.1", verdict: "warn" };
    case "":
      return { name: "unknown (no Resource Timing)", verdict: "warn" };
    default:
      return { name: token, verdict: "warn" };
  }
}

/**
 * Resolve the negotiated protocol for a just-issued request by waiting for its
 * PerformanceResourceTiming entry — it lands a tick *after* fetch() resolves, so
 * a synchronous read races and usually misses it. Matches on the unique token in
 * the URL (looser than exact-equality, survives URL normalization) and falls
 * back to whatever the buffer holds at timeout.
 *
 * Only reliable same-origin: cross-origin entries hide `nextHopProtocol` unless
 * the server sends `Timing-Allow-Origin`.
 */
function awaitNegotiatedProtocol(token: string, timeoutMs = 2000): Promise<string | undefined> {
  const fromBuffer = () =>
    (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .filter((e) => e.name.includes(token))
      .at(-1)?.nextHopProtocol;

  const existing = fromBuffer();
  if (existing) return Promise.resolve(existing);
  if (typeof PerformanceObserver === "undefined") return Promise.resolve(undefined);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: string | undefined) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(value);
    };
    const observer = new PerformanceObserver(() => {
      const proto = fromBuffer();
      if (proto) finish(proto);
    });
    observer.observe({ type: "resource", buffered: true });
    const timer = setTimeout(() => finish(fromBuffer()), timeoutMs);
  });
}

/** Protocol the document itself was served over — always present after load. */
function documentProtocol(): string {
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.nextHopProtocol ?? "";
}

function capabilityChecks(): Check[] {
  const nav = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;
  const docProto = protocolLabel(nav?.nextHopProtocol ?? "");

  return [
    {
      label: "Document negotiated protocol",
      verdict: docProto.verdict,
      detail: `This page was served over ${docProto.name}. HTTP/3 may only appear on subsequent requests after Alt-Svc upgrade.`,
    },
    {
      label: "EventSource (SSE) API",
      verdict: typeof EventSource !== "undefined" ? "ok" : "fail",
      detail:
        typeof EventSource !== "undefined"
          ? "Browser supports Server-Sent Events."
          : "EventSource is not available in this browser.",
    },
    {
      label: "WebSocket API",
      verdict: typeof WebSocket !== "undefined" ? "ok" : "fail",
      detail:
        typeof WebSocket !== "undefined"
          ? "Browser supports WebSocket (capability only — no live round-trip tested)."
          : "WebSocket is not available in this browser.",
    },
    {
      label: "Fetch response streaming",
      verdict:
        typeof ReadableStream !== "undefined" &&
        typeof Response !== "undefined" &&
        "body" in Response.prototype
          ? "ok"
          : "warn",
      detail:
        "ReadableStream on Response.body (alternative streaming transport).",
    },
  ];
}

function VerdictChip({ verdict }: { readonly verdict: Verdict }) {
  const styles: Record<Verdict, string> = {
    ok: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warn: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    pending:
      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  };
  const text: Record<Verdict, string> = {
    ok: "OK",
    warn: "WARN",
    fail: "FAIL",
    pending: "…",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[verdict]}`}
    >
      {text[verdict]}
    </span>
  );
}

function CheckTable({ rows }: { readonly rows: Check[] }) {
  return (
    <table className="w-full text-sm border-collapse">
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.label}
            className="border-b border-neutral-200 dark:border-neutral-700 align-top"
          >
            <td className="py-2 pr-4 whitespace-nowrap">
              <VerdictChip verdict={row.verdict} />
            </td>
            <td className="py-2 pr-4 font-medium text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
              {row.label}
            </td>
            <td className="py-2 text-neutral-600 dark:text-neutral-400">
              {row.detail}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const SSE_PING_URL = "/debug/sse-ping";
const HEALTH_PROBE_URL = "/healthz/live";
const SSE_TIMEOUT_MS = 8000;

export default function DebugConnectivityRoute(_props: Route.ComponentProps) {
  const [caps, setCaps] = useState<Check[]>([]);
  const [apiProto, setApiProto] = useState<Check | null>(null);
  const [sse, setSse] = useState<Check>({
    label: "Live SSE round-trip",
    verdict: "pending",
    detail: "Idle — press Run.",
  });
  const [sseEvents, setSseEvents] = useState<string[]>([]);

  // Capability + document-protocol checks run once on mount. Deferred via rAF
  // so the update is not synchronous within the effect, and so it only runs in
  // the browser (these APIs do not exist during SSR).
  useEffect(() => {
    const id = requestAnimationFrame(() => setCaps(capabilityChecks()));
    return () => cancelAnimationFrame(id);
  }, []);

  // Probe the SSR edge's negotiated protocol via a real same-origin fetch.
  const runProtocolProbe = useCallback(async () => {
    const label = "Edge negotiated protocol (live fetch)";
    setApiProto({ label, verdict: "pending", detail: `Fetching ${HEALTH_PROBE_URL}…` });

    const token = `_=${Date.now()}`;
    try {
      await fetch(`${HEALTH_PROBE_URL}?${token}`, { cache: "no-store" });
    } catch {
      setApiProto({ label, verdict: "fail", detail: `Could not reach ${HEALTH_PROBE_URL}.` });
      return;
    }

    const fetched = await awaitNegotiatedProtocol(token);
    if (fetched) {
      const proto = protocolLabel(fetched);
      setApiProto({
        label,
        verdict: proto.verdict,
        detail: `Same-origin request to ${HEALTH_PROBE_URL} was served over ${proto.name}.`,
      });
      return;
    }

    // Resource Timing didn't expose the fetch's protocol — fall back to the
    // document's negotiated protocol, which traverses the same edge/hop.
    const navProto = documentProtocol();
    if (navProto) {
      const proto = protocolLabel(navProto);
      setApiProto({
        label,
        verdict: proto.verdict,
        detail: `Resource Timing didn't expose the fetch protocol; using the document's negotiated protocol instead (${proto.name}, same edge).`,
      });
      return;
    }

    setApiProto({
      label,
      verdict: "warn",
      detail: "Resource Timing unavailable — protocol could not be determined.",
    });
  }, []);

  const runSseProbe = useCallback(() => {
    if (typeof EventSource === "undefined") {
      setSse({
        label: "Live SSE round-trip",
        verdict: "fail",
        detail: "EventSource unavailable.",
      });
      return;
    }

    setSse({
      label: "Live SSE round-trip",
      verdict: "pending",
      detail: `Connecting to ${SSE_PING_URL}…`,
    });
    setSseEvents([]);

    const started = performance.now();
    let firstEventAt: number | undefined;
    const es = new EventSource(SSE_PING_URL);

    const timeout = setTimeout(() => {
      es.close();
      setSse({
        label: "Live SSE round-trip",
        verdict: "fail",
        detail: `No completion within ${SSE_TIMEOUT_MS}ms — likely buffered or blocked by a proxy.`,
      });
    }, SSE_TIMEOUT_MS);

    es.addEventListener("tick", (ev) => {
      firstEventAt ??= performance.now();
      setSseEvents((prev) => [...prev, `tick → ${(ev as MessageEvent).data}`]);
    });

    es.addEventListener("done", (ev) => {
      clearTimeout(timeout);
      es.close();
      const ttfb = firstEventAt ? Math.round(firstEventAt - started) : -1;
      setSseEvents((prev) => [...prev, `done → ${(ev as MessageEvent).data}`]);
      setSse({
        label: "Live SSE round-trip",
        verdict: "ok",
        detail: `Stream delivered incrementally. Time to first event: ${ttfb}ms.`,
      });
    });

    es.onerror = () => {
      // EventSource auto-reconnects; only treat as failure if nothing arrived.
      if (firstEventAt === undefined) {
        clearTimeout(timeout);
        es.close();
        setSse({
          label: "Live SSE round-trip",
          verdict: "fail",
          detail: `Connection error before any event reached ${SSE_PING_URL}.`,
        });
      }
    };
  }, []);

  const runAll = useCallback(() => {
    setCaps(capabilityChecks());
    void runProtocolProbe();
    runSseProbe();
  }, [runProtocolProbe, runSseProbe]);

  return (
    <main className="pt-16 p-4 container mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Connectivity diagnostics
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-sm">
          Verifies transport capabilities (HTTP/2, HTTP/3, SSE, WebSocket)
          before relying on them for real-time updates. Gated by{" "}
          <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
            import.meta.env.DEV
          </code>{" "}
          or{" "}
          <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
            ENABLE_DEBUG_CONFIG=true
          </code>
          .
        </p>
      </header>

      <button
        type="button"
        onClick={runAll}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        Run live probes
      </button>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Browser capabilities</h2>
        <CheckTable rows={caps} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Edge protocol & live SSE</h2>
        <CheckTable rows={[apiProto, sse].filter((c): c is Check => c !== null)} />
        {sseEvents.length > 0 && (
          <pre className="mt-2 rounded bg-neutral-100 dark:bg-neutral-800 p-3 text-xs font-mono overflow-x-auto">
            {sseEvents.join("\n")}
          </pre>
        )}
      </section>
    </main>
  );
}
