import { expect, test } from "./fixtures";

test("home loads and shows authenticated app after sign-in", async ({ page }) => {
  await page.goto("/");

  // Must stay on the app — not redirected to auth
  await expect(page).toHaveURL(/localhost:5173/);

  // Header link is present
  await expect(page.getByRole("link", { name: /ClutterStock/i })).toBeVisible();

  // Stats panel confirms real data loaded
  await expect(page.getByText("Total items")).toBeVisible();

  // Account button confirms authenticated session (shows user avatar, not sign-in)
  await expect(page.getByRole("button", { name: /account/i })).toBeVisible();
});
