import { expect, test } from "./fixtures";
import {
  createItem,
  deleteCurrentItem,
  gotoStandardTheme,
  openItemByName,
  uniqueSuffix,
} from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("filtering and search (standard theme)", () => {
  test("/ opens search and filters the items table by name", async ({ page }) => {
    const uniqueName = uniqueSuffix("Searchable");

    await gotoStandardTheme(page);
    await createItem(page, { name: uniqueName, description: "find me" });

    // Drop focus & close the detail panel so the global "/" handler fires.
    await page.keyboard.press("Escape");
    await page.locator("body").click({ position: { x: 5, y: 5 } });

    await page.keyboard.press("/");
    const searchInput = page.locator(".cs-search-input");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();

    await searchInput.fill(uniqueName);
    const itemsTable = page.locator(".cs-body table");
    await expect(itemsTable.locator("tbody tr")).toHaveCount(1);
    await expect(itemsTable.getByText(uniqueName, { exact: true })).toBeVisible();

    // Esc clears the search and re-shows all rows.
    await searchInput.press("Escape");
    await expect(searchInput).toBeHidden();
    const visibleCount = await itemsTable.locator("tbody tr").count();
    expect(visibleCount).toBeGreaterThan(1);

    // Cleanup.
    await openItemByName(page, uniqueName);
    await deleteCurrentItem(page);
  });

  test("clicking a sidebar room filters items and the chip clears it", async ({
    page,
  }) => {
    const uniqueName = uniqueSuffix("Filterable");

    await gotoStandardTheme(page);
    await createItem(page, { name: uniqueName });

    // Read which room our newly created item landed in (the "Room" cell of
    // its row in the items table) — that's the sidebar entry to click.
    const itemsTable = page.locator(".cs-body table");
    const row = itemsTable.locator("tr", { hasText: uniqueName }).first();
    const roomName = (await row.locator("td").nth(1).innerText()).trim();
    expect(roomName).not.toBe("");
    expect(roomName).not.toBe("—");

    // Close the detail panel so the layout doesn't shift.
    await page.keyboard.press("Escape");

    // The sidebar's first aside is the rooms panel. Match the row by name —
    // accessible name is "<room> <count>".
    const sidebar = page.locator(".cs-body aside.tui-panel").first();
    await sidebar
      .getByRole("button", { name: new RegExp(`^${roomName}\\s+\\d+$`) })
      .first()
      .click();

    // Toolbar shows a "Room" chip with the location/room path. Use
    // toContainText to dodge strict-mode collisions ("Living Room" overlaps
    // with the "Room" chip label).
    const toolbar = page.locator(".cs-toolbar");
    await expect(toolbar).toContainText("Room");
    await expect(toolbar).toContainText(roomName);

    // Every visible item row should belong to the filtered room.
    const rows = itemsTable.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const cellRoom = (await rows.nth(i).locator("td").nth(1).innerText()).trim();
      expect(cellRoom).toBe(roomName);
    }

    // Clear via the × in the chip — only one chip is active so a toolbar-
    // scoped role lookup is unambiguous.
    await toolbar.getByRole("button", { name: "×" }).click();
    await expect(toolbar.getByText("All items")).toBeVisible();

    // Cleanup.
    await openItemByName(page, uniqueName);
    await deleteCurrentItem(page);
  });

  test("category sidebar entry filters by category", async ({ page }) => {
    const uniqueCategory = uniqueSuffix("E2ECat").replace(/[^a-zA-Z0-9-]/g, "");
    const uniqueName = uniqueSuffix("CatItem");

    await gotoStandardTheme(page);
    await createItem(page, { name: uniqueName, category: uniqueCategory });
    await page.keyboard.press("Escape");

    const sidebar = page.locator(".cs-body aside.tui-panel").first();
    await sidebar
      .getByRole("button", { name: new RegExp(`^${uniqueCategory}\\s+\\d+$`) })
      .click();

    const toolbar = page.locator(".cs-toolbar");
    await expect(toolbar).toContainText("Category");
    await expect(toolbar).toContainText(uniqueCategory);

    const itemsTable = page.locator(".cs-body table");
    await expect(itemsTable.locator("tbody tr")).toHaveCount(1);
    await expect(itemsTable.getByText(uniqueName, { exact: true })).toBeVisible();

    await toolbar.getByRole("button", { name: "×" }).click();
    await expect(toolbar.getByText("All items")).toBeVisible();

    // Cleanup.
    await openItemByName(page, uniqueName);
    await deleteCurrentItem(page);
  });
});
