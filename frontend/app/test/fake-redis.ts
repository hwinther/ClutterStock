/**
 * An in-memory stand-in for the node-redis client, covering the calls the *.server.ts modules make
 * (get/set with EX, del, ttl). Use it with
 *   vi.mock("~/lib/redis.server", () => ({ redis: () => fakeRedis }))
 * and call fakeRedis.reset() in beforeEach.
 */
interface Entry {
  value: string
  ttl: number
}

const store = new Map<string, Entry>()

export const fakeRedis = {
  store,
  reset() {
    store.clear()
  },
  async get(key: string): Promise<string | null> {
    return store.get(key)?.value ?? null
  },
  async set(key: string, value: string, options?: { EX?: number }): Promise<string> {
    store.set(key, { value, ttl: options?.EX ?? -1 })
    return 'OK'
  },
  async del(key: string): Promise<number> {
    return store.delete(key) ? 1 : 0
  },
  // Redis answers -2 for a missing key and -1 for one without an expiry.
  async ttl(key: string): Promise<number> {
    return store.get(key)?.ttl ?? -2
  },
}
