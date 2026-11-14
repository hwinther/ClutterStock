// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeRedis } from "~/test/fake-redis";
import {
  type Session,
  clearCookie,
  createSession,
  destroySession,
  getSession,
  getSid,
  sessionCookie,
  updateSession,
} from "./session.server";

vi.mock("~/lib/redis.server", () => ({ redis: () => fakeRedis }));

const WEEK = 7 * 24 * 60 * 60;

const session: Session = {
  accessToken: "at",
  refreshToken: "rt",
  expiresAt: 1_900_000_000,
  idToken: "id",
  user: { sub: "u1", name: "Ada" },
};

function requestWithCookie(cookie?: string): Request {
  return new Request("https://clutterstock.test/", {
    headers: cookie ? { cookie } : {},
  });
}

beforeEach(() => {
  fakeRedis.reset();
});

describe("getSid", () => {
  it("reads the session id among other cookies", () => {
    expect(getSid(requestWithCookie("theme=x; clutterstock_sid=abc-123; other=y"))).toBe("abc-123");
  });

  it("reads it as the first cookie", () => {
    expect(getSid(requestWithCookie("clutterstock_sid=first"))).toBe("first");
  });

  it("ignores a cookie whose name only ends with clutterstock_sid", () => {
    expect(getSid(requestWithCookie("not_clutterstock_sid=nope"))).toBeUndefined();
  });

  it("is undefined without a cookie header", () => {
    expect(getSid(requestWithCookie())).toBeUndefined();
  });
});

describe("session store", () => {
  it("creates a session with a week's expiry and reads it back", async () => {
    const sid = await createSession(session);

    expect(fakeRedis.store.get(`session:${sid}`)?.ttl).toBe(WEEK);
    await expect(getSession(requestWithCookie(`clutterstock_sid=${sid}`))).resolves.toEqual({
      sid,
      data: session,
    });
  });

  it("returns null without a cookie or for an unknown id", async () => {
    await expect(getSession(requestWithCookie())).resolves.toBeNull();
    await expect(getSession(requestWithCookie("clutterstock_sid=gone"))).resolves.toBeNull();
  });

  it("keeps the remaining expiry on update", async () => {
    await fakeRedis.set("session:s1", JSON.stringify(session), { EX: 120 });

    await updateSession("s1", { ...session, accessToken: "at2" });

    const entry = fakeRedis.store.get("session:s1");
    expect(entry?.ttl).toBe(120);
    expect(JSON.parse(entry!.value).accessToken).toBe("at2");
  });

  it("falls back to a week when the key has no expiry left", async () => {
    await updateSession("s2", session);
    expect(fakeRedis.store.get("session:s2")?.ttl).toBe(WEEK);
  });

  it("destroys a session", async () => {
    const sid = await createSession(session);
    await destroySession(sid);
    expect(fakeRedis.store.has(`session:${sid}`)).toBe(false);
  });
});

describe("cookies", () => {
  it("sets an HttpOnly, SameSite=Lax cookie for a week", () => {
    expect(sessionCookie("abc")).toBe(
      `clutterstock_sid=abc; Path=/; HttpOnly; SameSite=Lax; Max-Age=${WEEK}`,
    );
  });

  it("clears it with Max-Age=0", () => {
    expect(clearCookie()).toBe("clutterstock_sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  });
});
