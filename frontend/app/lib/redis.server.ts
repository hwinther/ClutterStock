import { createClient } from "redis";

let _client: ReturnType<typeof createClient> | undefined;

export function redis() {
  if (!_client) {
    _client = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:6379" });
    _client.on("error", (e) => console.error("[redis]", e));
    void _client.connect();
  }
  return _client;
}
