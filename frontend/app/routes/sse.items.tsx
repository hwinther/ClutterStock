import type { Route } from "./+types/sse.items";
import { redis } from "~/lib/redis.server";
import { getSession } from "~/lib/session.server";

/**
 * Server-Sent Events stream of item changes.
 *
 * The browser holds no API token, so it cannot subscribe to the backend
 * directly. Instead the SSR server (this route) authenticates via the
 * `clutterstock_sid` cookie and relays the backend's Redis pub/sub channel
 * (published by `RedisItemChangeNotifier` on add/update/delete) to the browser
 * as `text/event-stream`. The browser uses each event only as a nudge to
 * revalidate loaders — see `app/components/live-updates.tsx`.
 */
const CHANNEL = "clutterstock:item-changes";
const HEARTBEAT_MS = 25_000;

export async function loader({ request }: Route.LoaderArgs) {
  // EventSource sends the session cookie same-origin; require a valid session.
  const session = await getSession(request);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  // node-redis requires a dedicated connection for subscriber mode.
  const subscriber = redis().duplicate();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Controller already closed (client gone between checks) — ignore.
        }
      };
      const send = (event: string, data: string) =>
        enqueue(`event: ${event}\ndata: ${data}\n\n`);

      subscriber.on("error", (e) => console.error("[sse] redis subscriber:", e));
      await subscriber.connect();
      await subscriber.subscribe(CHANNEL, (message) => send("item-change", message));

      // Comment-only line; keeps idle-timeout proxies from dropping the stream.
      heartbeat = setInterval(() => enqueue(": ping\n\n"), HEARTBEAT_MS);

      // Initial event flushes headers through the proxy and confirms liveness.
      send("ready", JSON.stringify({ ts: Date.now() }));
    },
    async cancel() {
      closed = true;
      if (heartbeat) clearInterval(heartbeat);
      try {
        await subscriber.unsubscribe(CHANNEL);
        await subscriber.quit();
      } catch {
        // Best-effort teardown — connection may already be gone.
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

// NOTE: no default export — this is a React Router *resource route*. Exporting a
// component would make RR render HTML for the request instead of returning the
// streaming text/event-stream Response, which breaks EventSource.
