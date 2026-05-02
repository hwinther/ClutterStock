import { expect, test } from "./fixtures";
import {
  createItem,
  deleteCurrentItem,
  gotoStandardTheme,
  openItemByName,
  uniqueSuffix,
} from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("keyboard shortcuts (standard theme)", () => {
  test("? opens the help overlay; Esc closes it", async ({ page }) => {
    await gotoStandardTheme(page);
    await expect(page.getByRole("button", { name: /account/i })).toBeVisible();

    await page.keyboard.press("?");
    const overlay = page.getByRole("dialog", { name: /keyboard shortcuts/i });
    await expect(overlay).toBeVisible();
    // Spot-check a couple of well-known shortcut rows.
    await expect(overlay.getByText("next item")).toBeVisible();
    await expect(overlay.getByText("filter items")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden();
  });

  test("j and k move the selection through the items table", async ({ page }) => {
    // Seed two items so we can guarantee at least two distinct rows to step
    // through. Share a per-run token across both names so we can search for
    // exactly these two rows even if other tests (or leaked data from past
    // runs) sit in the shared dev DB.
    const token = uniqueSuffix("Kb");
    const a = `${token}-A`;
    const b = `${token}-B`;

    await gotoStandardTheme(page);

    for (const name of [a, b]) {
      await createItem(page, { name });
      await page.keyboard.press("Escape");
    }

    // Filter to just our two seeded rows so j/k navigation is deterministic.
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("/");
    const searchInput = page.locator(".cs-search-input");
    await searchInput.fill(token);
    await searchInput.press("Enter");
    await expect(searchInput).toBeHidden();

    const itemsTable = page.locator(".cs-body table");
    await expect(itemsTable.locator("tbody tr")).toHaveCount(2);

    // No selection yet — pressing j selects the first visible row.
    await page.keyboard.press("j");
    await expect(
      itemsTable.locator('tbody tr[data-selected="true"]'),
    ).toHaveCount(1);
    const firstSelectedText = (
      await itemsTable.locator('tbody tr[data-selected="true"]').first().innerText()
    ).trim();

    // Press j → selection moves to the next row.
    await page.keyboard.press("j");
    await expect(
      itemsTable.locator('tbody tr[data-selected="true"]'),
    ).toHaveCount(1);
    const secondSelectedText = (
      await itemsTable.locator('tbody tr[data-selected="true"]').first().innerText()
    ).trim();
    expect(secondSelectedText).not.toBe(firstSelectedText);

    // Press k → back to the first row.
    await page.keyboard.press("k");
    const backText = (
      await itemsTable.locator('tbody tr[data-selected="true"]').first().innerText()
    ).trim();
    expect(backText).toBe(firstSelectedText);

    // Cleanup both seeded items.
    for (const name of [a, b]) {
      await openItemByName(page, name);
      await deleteCurrentItem(page);
    }
  });
});
