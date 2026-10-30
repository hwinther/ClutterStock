import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Each side panel renders an `<aside class="tui-panel">` with a unique
// tui-panel-title. PanelHeader labels overlap (`ITEM #N` is a substring of
// `EDIT ITEM #N`), so disambiguate by the title text.
export class ItemPanel {
  readonly page: Page;
  readonly root: Locator;
  readonly title: Locator;

  constructor(page: Page, titleNeedle: string) {
    this.page = page;
    this.root = page.locator("aside.tui-panel").filter({
      has: page.locator(".tui-panel-title", { hasText: titleNeedle }),
    });
    this.title = this.root.locator("span.tui-panel-title").first();
  }

  get nameInput(): Locator { return this.root.locator('input[name="name"]'); }
  get descriptionInput(): Locator { return this.root.locator('textarea[name="description"]'); }
  get categoryInput(): Locator { return this.root.locator('input[name="category"]'); }
  get notesInput(): Locator { return this.root.locator('textarea[name="notes"]'); }
  get closeButton(): Locator { return this.root.getByRole("button", { name: "×" }); }
  get cancelButton(): Locator { return this.root.getByRole("button", { name: "Cancel" }); }

  button(name: string | RegExp): Locator {
    return this.root.getByRole("button", { name });
  }

  isVisible(): Promise<boolean> { return this.root.isVisible(); }

  async expectVisible(): Promise<void> { await expect(this.root).toBeVisible(); }
  async expectHidden(timeout?: number): Promise<void> {
    await expect(this.root).toBeHidden(timeout != null ? { timeout } : undefined);
  }

  async fillForm(opts: { name?: string; description?: string; category?: string; notes?: string }): Promise<void> {
    if (opts.name !== undefined) await this.nameInput.fill(opts.name);
    if (opts.description !== undefined) await this.descriptionInput.fill(opts.description);
    if (opts.category !== undefined) await this.categoryInput.fill(opts.category);
    if (opts.notes !== undefined) await this.notesInput.fill(opts.notes);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.expectHidden();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.expectHidden();
  }
}
