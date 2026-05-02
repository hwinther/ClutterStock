import { expect, test } from "./fixtures";
import { uniqueSuffix } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("keyboard shortcuts (standard theme)", () => {
  test("? opens the help overlay; Esc closes it", async ({ home }) => {
    await home.goto();
    await home.expectAuthenticated();

    await home.help.open();
    // Spot-check a couple of well-known shortcut rows.
    await expect(home.help.rowByLabel("next item")).toBeVisible();
    await expect(home.help.rowByLabel("filter items")).toBeVisible();

    await home.help.close();
  });

  test("j and k move the selection through the items table", async ({ home }) => {
    // Seed two items so we can guarantee at least two distinct rows to step
    // through. Share a per-run token across both names so we can search for
    // exactly these two rows even if other tests (or leaked data from past
    // runs) sit in the shared dev DB.
    const token = uniqueSuffix("Kb");
    const a = `${token}-A`;
    const b = `${token}-B`;

    await home.goto();

    for (const name of [a, b]) {
      await home.createItem({ name });
      await home.page.keyboard.press("Escape");
    }

    // Filter to just our two seeded rows so j/k navigation is deterministic.
    await home.page.locator("body").click({ position: { x: 5, y: 5 } });
    await home.searchBar.open();
    await home.searchBar.fill(token);
    await home.searchBar.submit();

    await home.itemsTable.expectRowCount(2);

    // No selection yet — pressing j selects the first visible row.
    await home.page.keyboard.press("j");
    await expect(home.itemsTable.selectedRows).toHaveCount(1);
    const firstSelectedText = await home.itemsTable.selectedRowText();

    // Press j → selection moves to the next row.
    await home.page.keyboard.press("j");
    await expect(home.itemsTable.selectedRows).toHaveCount(1);
    const secondSelectedText = await home.itemsTable.selectedRowText();
    expect(secondSelectedText).not.toBe(firstSelectedText);

    // Press k → back to the first row.
    await home.page.keyboard.press("k");
    const backText = await home.itemsTable.selectedRowText();
    expect(backText).toBe(firstSelectedText);

    // Cleanup both seeded items.
    for (const name of [a, b]) {
      await home.openItemByName(name);
      await home.deleteCurrentItem();
    }
  });
});
