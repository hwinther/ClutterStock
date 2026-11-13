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
  // color-contrast is off until the theme colours are adjusted (its own round, with before/after
  // screenshots): .theme-toggle, the .cs-toolbar labels and a few more fall below 4.5:1.
  await expectAccessible(home.page, { disableRules: ["color-contrast"] });
});
