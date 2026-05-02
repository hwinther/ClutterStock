import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("sign-out clears the app session and forces re-auth on next visit", async ({ home, page }) => {
  await home.goto();
  await home.expectAuthenticated();

  // Sanity: the app session cookie is set after auth.setup.
  const before = await page.context().cookies("http://localhost:5173/");
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
        const cs = await page.context().cookies("http://localhost:5173/");
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
  const res = await page.request.get("http://localhost:5173/", {
    maxRedirects: 0,
  });
  expect(res.status()).toBe(302);
  expect(res.headers().location ?? "").toMatch(/\/auth\/signin/);
});
