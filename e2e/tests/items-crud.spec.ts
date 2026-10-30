import { expect, test } from "./fixtures";
import { uniqueSuffix } from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("items CRUD (standard theme)", () => {
  test("create, view, edit, then delete an item", async ({ home }) => {
    const itemName = uniqueSuffix("E2E Item");
    const editedName = `${itemName} (edited)`;

    await home.goto();
    await home.expectAuthenticated();

    // ── Create ────────────────────────────────────────────────────────────
    // Note: the dev DB is shared across parallel workers, so we don't assert
    // on absolute "Total items" counts — other tests can change them
    // concurrently. We verify CRUD via the row's presence in the table
    // instead.
    await home.createItem({
      name: itemName,
      description: "Created by e2e test",
      category: "E2E",
      notes: "temporary",
    });

    await expect(home.viewPanel.root.getByText(itemName, { exact: true })).toBeVisible();
    await home.itemsTable.expectRowVisible(itemName);

    // ── Edit ──────────────────────────────────────────────────────────────
    await home.viewPanel.button("Edit").click();
    await home.editPanel.expectVisible();
    await home.editPanel.nameInput.fill(editedName);
    await home.editPanel.button("Save changes").click();

    // Verify success via the table — see HomePage.createItem for why we don't
    // rely on the panel auto-transitioning back to view mode.
    await home.itemsTable.expectRowVisible(editedName, { timeout: 15_000 });
    if (await home.editPanel.isVisible()) {
      await home.editPanel.cancel();
    }
    if (!(await home.viewPanel.isVisible())) {
      await home.itemsTable.clickRow(editedName);
    }
    await home.viewPanel.expectVisible();
    await expect(home.viewPanel.root.getByText(editedName, { exact: true })).toBeVisible();

    // ── Delete ────────────────────────────────────────────────────────────
    await home.deleteCurrentItem();
    await home.itemsTable.expectRowHidden(editedName, { timeout: 15_000 });
  });

  test("name is required when creating an item", async ({ home }) => {
    await home.goto();

    const newPanel = await home.openNewItemFlow();

    // The input has `required` — the browser blocks submission and the panel
    // should stay open instead of switching to the detail view.
    await newPanel.button("Create item").click();

    await newPanel.expectVisible();
    await expect(newPanel.nameInput).toBeFocused();
    const valueMissing = await newPanel.nameInput.evaluate(
      (el: HTMLInputElement) => el.validity.valueMissing,
    );
    expect(valueMissing).toBe(true);

    // Cancel cleans up so we don't leak panel state into the next test.
    await newPanel.cancel();
  });

  test("can reopen an item from the table after closing the panel", async ({ home }) => {
    const itemName = uniqueSuffix("Reopen");

    await home.goto();
    await home.createItem({ name: itemName });

    // Close via the panel's × — view panel should disappear.
    await home.viewPanel.close();

    // Click the row again — view panel reopens with the same item.
    await home.itemsTable.clickRow(itemName);
    await home.viewPanel.expectVisible();
    await expect(home.viewPanel.root.getByText(itemName, { exact: true })).toBeVisible();

    // Cleanup.
    await home.deleteCurrentItem();
  });
});
