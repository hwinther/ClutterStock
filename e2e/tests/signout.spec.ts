import fs from "node:fs";
import { expect, test } from "./fixtures";
import { appUrl } from "./app-url";
import { authFile, sessionFile } from "./auth-paths";

test.describe.configure({ mode: "serial" });

// The test aborts the redirect to Authelia's end-session (below), so the signed-out app page stays
// open and its live-updates stream reconnects without a session: 401. A real sign-out navigates
// away first, which closes the stream.
test.use({
  requestGuard: {
    allow: [(r) => r.status === 401 && new URL(r.url).pathname === "/sse/items"],
  },
});

// Sign-out destroys the Redis session keyed by the sid baked into user.json.
// If we leave the cached storage files behind, the auth.setup mtime gate (20
// minutes) will skip the OTP flow on the next run and every test will hit a
// stale sid the server no longer recognises. Force a fresh authentication.
test.afterAll(async () => {
  await fs.promises.rm(authFile, { force: true });
  await fs.promises.rm(sessionFile, { force: true });
});

test("sign-out clears the app session and forces re-auth on next visit", async ({ home, page }) => {
  await home.goto();
  await home.expectAuthenticated();

  // Sanity: the app session cookie is set after auth.setup.
  const before = await page.context().cookies(appUrl.href);
  expect(before.some((c) => c.name === "clutterstock_sid" && c.value)).toBe(true);

  // Abort the navigation to Authelia's end-session endpoint. The /auth/signout
  // server response has already cleared the app cookie via Set-Cookie before
  // the browser tries to follow the redirect, so the user is logged out of
  // the app — but Authelia's IdP session stays intact, which matters because
  // the storageState in playwright/.auth/user.json (shared by every parallel
  // test in this run) carries Authelia's session cookie. Letting Authelia
  // process end-session would invalidate that cookie and break tests still
  // running concurrently.
  await page.route(/\/api\/oidc\/(logout|end[_-]?session)/i, (route) =>
    route.abort(),
  );

  await home.signOut();

  // 1) The BFF wiped the session in Redis and told the browser to drop the sid.
  await expect
    .poll(
      async () => {
        const cs = await page.context().cookies(appUrl.href);
        return cs.find((c) => c.name === "clutterstock_sid")?.value ?? "";
      },
      { timeout: 10_000 },
    )
    .toBe("");

  // 2) Hitting / again now returns 302 → /auth/signin instead of rendering
  //    the authenticated app. Use page.request (which shares the context's
  //    cookie jar) with maxRedirects: 0 so we observe the immediate response
  //    without following the redirect chain into Authelia — Authelia would
  //    silently re-auth via its still-valid IdP cookie, defeating the point.
  const res = await page.request.get(appUrl.href, {
    maxRedirects: 0,
  });
  expect(res.status()).toBe(302);
  expect(res.headers().location ?? "").toMatch(/\/auth\/signin/);
});
