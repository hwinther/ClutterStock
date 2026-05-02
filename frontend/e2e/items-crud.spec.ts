import { expect, test } from "./fixtures";
import {
  createItem,
  deleteCurrentItem,
  gotoStandardTheme,
  openNewItemPanel,
  panels,
  uniqueSuffix,
} from "./helpers";

test.describe.configure({ mode: "serial" });

test.describe("items CRUD (standard theme)", () => {
  test("create, view, edit, then delete an item", async ({ page }) => {
    const itemName = uniqueSuffix("E2E Item");
    const editedName = `${itemName} (edited)`;

    await gotoStandardTheme(page);
    await expect(page.getByRole("button", { name: /account/i })).toBeVisible();

    // ── Create ────────────────────────────────────────────────────────────
    // Note: the dev DB is shared across parallel workers, so we don't assert
    // on absolute "Total items" counts — other tests can change them
    // concurrently. We verify CRUD via the row's presence in the table
    // instead.
    await createItem(page, {
      name: itemName,
      description: "Created by e2e test",
      category: "E2E",
      notes: "temporary",
    });

    const viewPanel = panels.view(page);
    await expect(viewPanel.getByText(itemName, { exact: true })).toBeVisible();

    const itemsTable = page.locator(".cs-body table");
    await expect(itemsTable.getByText(itemName, { exact: true })).toBeVisible();

    // ── Edit ──────────────────────────────────────────────────────────────
    await viewPanel.getByRole("button", { name: "Edit" }).click();
    const editPanel = panels.edit(page);
    await expect(editPanel).toBeVisible();

    await editPanel.locator('input[name="name"]').fill(editedName);
    await editPanel.getByRole("button", { name: "Save changes" }).click();

    // Verify success via the table — see helpers.createItem for why we don't
    // rely on the panel auto-transitioning back to view mode.
    await expect(itemsTable.getByText(editedName, { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    if (await editPanel.isVisible()) {
      await editPanel.getByRole("button", { name: "Cancel" }).click();
      await expect(editPanel).toBeHidden();
    }
    // Open the view panel from the freshly-renamed row.
    if (!(await viewPanel.isVisible())) {
      await itemsTable.getByText(editedName, { exact: true }).click();
    }
    await expect(viewPanel).toBeVisible();
    await expect(viewPanel.getByText(editedName, { exact: true })).toBeVisible();

    // ── Delete ────────────────────────────────────────────────────────────
    await deleteCurrentItem(page);
    await expect(itemsTable.getByText(editedName, { exact: true })).toBeHidden({
      timeout: 15_000,
    });
  });

  test("name is required when creating an item", async ({ page }) => {
    await gotoStandardTheme(page);

    const newPanel = await openNewItemPanel(page);
    const nameInput = newPanel.locator('input[name="name"]');

    // The input has `required` — the browser blocks submission and the panel
    // should stay open instead of switching to the detail view.
    await newPanel.getByRole("button", { name: "Create item" }).click();

    await expect(newPanel).toBeVisible();
    await expect(nameInput).toBeFocused();
    const valueMissing = await nameInput.evaluate(
      (el: HTMLInputElement) => el.validity.valueMissing,
    );
    expect(valueMissing).toBe(true);

    // Cancel cleans up so we don't leak panel state into the next test.
    await newPanel.getByRole("button", { name: "Cancel" }).click();
    await expect(newPanel).toBeHidden();
  });

  test("can reopen an item from the table after closing the panel", async ({
    page,
  }) => {
    const itemName = uniqueSuffix("Reopen");

    await gotoStandardTheme(page);
    await createItem(page, { name: itemName });

    // Close via the panel's × — view panel should disappear.
    const view = panels.view(page);
    await view.getByRole("button", { name: "×" }).click();
    await expect(view).toBeHidden();

    // Click the row again — view panel reopens with the same item.
    const itemsTable = page.locator(".cs-body table");
    await itemsTable.getByText(itemName, { exact: true }).click();
    await expect(view).toBeVisible();
    await expect(view.getByText(itemName, { exact: true })).toBeVisible();

    // Cleanup.
    await deleteCurrentItem(page);
  });
});
