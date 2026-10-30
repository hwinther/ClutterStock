import { expect, test } from "./fixtures";
import { uniqueSuffix } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("filtering and search (standard theme)", () => {
  test("/ opens search and filters the items table by name", async ({ home }) => {
    // Two items so the post-Esc assertion can prove the filter was actually
    // cleared (search narrows to A, Esc widens back to ≥2) without depending
    // on incidental data left behind by other tests.
    const a = uniqueSuffix("Searchable-A");
    const b = uniqueSuffix("Searchable-B");

    await home.goto();
    await home.createItem({ name: a, description: "find me" });
    await home.createItem({ name: b });

    // Drop focus & close the detail panel so the global "/" handler fires.
    await home.page.keyboard.press("Escape");
    await home.page.locator("body").click({ position: { x: 5, y: 5 } });

    await home.searchBar.open();
    await home.searchBar.expectFocused();

    await home.searchBar.fill(a);
    await home.itemsTable.expectRowCount(1);
    await home.itemsTable.expectRowVisible(a);
    await home.itemsTable.expectRowHidden(b);

    // Esc clears the search and re-shows all rows — both A and B come back.
    await home.searchBar.close();
    await home.itemsTable.expectRowVisible(a);
    await home.itemsTable.expectRowVisible(b);

    // Cleanup.
    await home.openItemByName(a);
    await home.deleteCurrentItem();
    await home.openItemByName(b);
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
