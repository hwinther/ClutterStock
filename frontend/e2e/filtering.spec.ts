import { expect, test } from "./fixtures";
import { uniqueSuffix } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("filtering and search (standard theme)", () => {
  test("/ opens search and filters the items table by name", async ({ home }) => {
    const uniqueName = uniqueSuffix("Searchable");

    await home.goto();
    await home.createItem({ name: uniqueName, description: "find me" });

    // Drop focus & close the detail panel so the global "/" handler fires.
    await home.page.keyboard.press("Escape");
    await home.page.locator("body").click({ position: { x: 5, y: 5 } });

    await home.searchBar.open();
    await home.searchBar.expectFocused();

    await home.searchBar.fill(uniqueName);
    await home.itemsTable.expectRowCount(1);
    await home.itemsTable.expectRowVisible(uniqueName);

    // Esc clears the search and re-shows all rows.
    await home.searchBar.close();
    expect(await home.itemsTable.rows.count()).toBeGreaterThan(1);

    // Cleanup.
    await home.openItemByName(uniqueName);
    await home.deleteCurrentItem();
  });

  test("clicking a sidebar room filters items and the chip clears it", async ({ home }) => {
    const uniqueName = uniqueSuffix("Filterable");

    await home.goto();
    await home.createItem({ name: uniqueName });

    // Read which room our newly created item landed in (the "Room" cell of
    // its row in the items table) — that's the sidebar entry to click.
    const roomName = await home.itemsTable.roomOf(uniqueName);
    expect(roomName).not.toBe("");
    expect(roomName).not.toBe("—");

    // Close the detail panel so the layout doesn't shift.
    await home.page.keyboard.press("Escape");

    await home.sidebar.clickRoom(roomName);

    // Toolbar shows a "Room" chip with the location/room path.
    await home.toolbar.expectChip("Room", roomName);

    // Every visible item row should belong to the filtered room.
    const count = await home.itemsTable.rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const cellRoom = (
        await home.itemsTable.rows.nth(i).locator("td").nth(1).innerText()
      ).trim();
      expect(cellRoom).toBe(roomName);
    }

    await home.toolbar.clearActiveFilter();

    // Cleanup.
    await home.openItemByName(uniqueName);
    await home.deleteCurrentItem();
  });

  test("category sidebar entry filters by category", async ({ home }) => {
    const uniqueCategory = uniqueSuffix("E2ECat").replace(/[^a-zA-Z0-9-]/g, "");
    const uniqueName = uniqueSuffix("CatItem");

    await home.goto();
    await home.createItem({ name: uniqueName, category: uniqueCategory });
    await home.page.keyboard.press("Escape");

    await home.sidebar.clickCategory(uniqueCategory);

    await home.toolbar.expectChip("Category", uniqueCategory);
    await home.itemsTable.expectRowCount(1);
    await home.itemsTable.expectRowVisible(uniqueName);

    await home.toolbar.clearActiveFilter();

    // Cleanup.
    await home.openItemByName(uniqueName);
    await home.deleteCurrentItem();
  });
});
