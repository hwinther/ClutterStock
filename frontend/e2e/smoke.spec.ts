import { expect, test } from "./fixtures";

test("home loads and shows authenticated app after sign-in", async ({ home }) => {
  await home.goto();

  // Must stay on the app — not redirected to auth.
  await expect(home.page).toHaveURL(/localhost:5173/);

  await expect(home.headerLink).toBeVisible();

  // Stats panel confirms real data loaded.
  await expect(home.page.getByText("Total items")).toBeVisible();

  // Account button confirms authenticated session (shows user avatar, not sign-in).
  await home.expectAuthenticated();
});
