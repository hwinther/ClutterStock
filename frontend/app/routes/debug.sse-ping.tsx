import type { Route } from "./+types/debug.sse-ping";
import { isDebugConfigAllowed } from "~/lib/debug-config";

/**
 * Minimal Server-Sent Events probe used by the connectivity debug page.
 *
 * Streams a handful of `tick` events at a fixed cadence then a final `done`
 * event and closes. The point is not the payload but proving the whole edge
 * path (proxy/load-balancer) delivers `text/event-stream` incrementally
 * without buffering or prematurely timing out the connection.
 *
 * Gated identically to {@link isDebugConfigAllowed} — 404 in production unless
 * `ENABLE_DEBUG_CONFIG=true`.
 */
const TICK_COUNT = 5;
const TICK_INTERVAL_MS = 250;

export function loader(_args: Route.LoaderArgs) {
  if (!isDebugConfigAllowed()) {
    throw new Response(null, { status: 404 });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let seq = 0;

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `id: ${seq}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      // Emit one immediately so time-to-first-event reflects real latency,
      // not the tick interval.
      send("tick", { seq, ts: Date.now() });
      seq += 1;

      timer = setInterval(() => {
        if (seq >= TICK_COUNT) {
          send("done", { total: seq, ts: Date.now() });
          clearInterval(timer);
          controller.close();
          return;
        }
        send("tick", { seq, ts: Date.now() });
        seq += 1;
      }, TICK_INTERVAL_MS);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Hint to nginx/ingress not to buffer the stream.
      "X-Accel-Buffering": "no",
    },
  });
}

export default function DebugSsePing() {
  return null;
}
