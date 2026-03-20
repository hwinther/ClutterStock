import type { Route } from "./+types/healthz.ready";

export function loader(_args: Route.LoaderArgs) {
  return new Response("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export default function HealthzReady() {
  return null;
}
