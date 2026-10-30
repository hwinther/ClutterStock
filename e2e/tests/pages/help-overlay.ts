import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class HelpOverlay {
  readonly page: Page;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: /keyboard shortcuts/i });
  }

  async open(): Promise<void> {
    await this.page.keyboard.press("?");
    await expect(this.dialog).toBeVisible();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await expect(this.dialog).toBeHidden();
  }

  rowByLabel(label: string | RegExp): Locator {
    return this.dialog.getByText(label);
  }
}
