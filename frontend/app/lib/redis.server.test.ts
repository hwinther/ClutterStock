// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const client = { on: vi.fn(), connect: vi.fn(() => Promise.resolve()) };
const createClient = vi.fn((_options: { url: string }) => client);
vi.mock("redis", () => ({ createClient }));

describe("redis", () => {
  beforeEach(() => {
    vi.resetModules();
    createClient.mockClear();
    client.on.mockClear();
    client.connect.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates and connects one client from REDIS_URL", async () => {
    vi.stubEnv("REDIS_URL", "redis://cache:6380");
    const { redis } = await import("./redis.server");

    expect(redis()).toBe(client);
    expect(redis()).toBe(client);

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith({ url: "redis://cache:6380" });
    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it("defaults to localhost and logs client errors", async () => {
    vi.stubEnv("REDIS_URL", undefined);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { redis } = await import("./redis.server");

    redis();
    expect(createClient).toHaveBeenCalledWith({ url: "redis://localhost:6379" });

    const [event, onError] = client.on.mock.calls[0] as [string, (e: Error) => void];
    expect(event).toBe("error");
    const error = new Error("ECONNREFUSED");
    onError(error);
    expect(log).toHaveBeenCalledWith("[redis]", error);
    log.mockRestore();
  });
});
