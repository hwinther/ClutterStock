import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class SearchBar {
  readonly page: Page;
  readonly input: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.locator(".cs-search-input");
  }

  // Make sure no input has focus so the global "/" handler fires, then press /.
  async open(): Promise<void> {
    await this.page.evaluate(() => {
      const el = document.activeElement;
      if (el && "blur" in el) (el as HTMLElement).blur();
    });
    await this.page.keyboard.press("/");
    await expect(this.input).toBeVisible();
  }

  async fill(text: string): Promise<void> {
    await this.input.fill(text);
  }

  async submit(): Promise<void> {
    await this.input.press("Enter");
    await expect(this.input).toBeHidden();
  }

  async close(): Promise<void> {
    await this.input.press("Escape");
    await expect(this.input).toBeHidden();
  }

  async expectFocused(): Promise<void> {
    await expect(this.input).toBeFocused();
  }
}
