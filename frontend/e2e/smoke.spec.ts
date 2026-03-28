import { expect, test } from "@playwright/test";

test("home shows welcome and Locations link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /locations/i })).toBeVisible();
  await expect(page.getByText(/what's next\?/i)).toBeVisible();
});
