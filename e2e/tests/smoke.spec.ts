import { expectAccessible } from "@wshno/playwright-config";
import { appUrl } from "./app-url";
import { expect, test } from "./fixtures";

test("home loads and shows authenticated app after sign-in", async ({ home }) => {
  await home.goto();

  // Must stay on the app — not redirected to auth.
  await expect.poll(() => new URL(home.page.url()).origin).toBe(appUrl.origin);

  await expect(home.headerLink).toBeVisible();

  // Stats panel confirms real data loaded.
  await expect(home.page.getByText("Total items")).toBeVisible();

  // Account button confirms authenticated session (shows user avatar, not sign-in).
  await home.expectAuthenticated();
});

// axe (WCAG 2.x A/AA): fails on serious or critical violations.
test("home page is accessible", async ({ home }) => {
  await home.goto();
  await expect(home.page.getByText("Total items")).toBeVisible();
  await expectAccessible(home.page);
});
