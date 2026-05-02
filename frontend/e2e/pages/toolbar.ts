import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class Toolbar {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator(".cs-toolbar");
  }

  // The toolbar shows at most one active filter chip; a role lookup is
  // unambiguous in that scope. Use toContainText for chip labels because
  // values like "Living Room" overlap with the literal "Room" chip label.
  get clearChipButton(): Locator { return this.root.getByRole("button", { name: "×" }); }

  async expectChip(label: string, value: string): Promise<void> {
    await expect(this.root).toContainText(label);
    await expect(this.root).toContainText(value);
  }

  async expectAllItems(): Promise<void> {
    await expect(this.root.getByText("All items")).toBeVisible();
  }

  async clearActiveFilter(): Promise<void> {
    await this.clearChipButton.click();
    await this.expectAllItems();
  }
}
