import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export class ItemsTable {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator(".cs-body table");
  }

  get rows(): Locator { return this.root.locator("tbody tr"); }
  get selectedRows(): Locator { return this.root.locator('tbody tr[data-selected="true"]'); }

  rowByName(name: string): Locator {
    return this.root.locator("tr", { hasText: name }).first();
  }

  cellByName(name: string): Locator {
    return this.root.getByText(name, { exact: true });
  }

  async expectRowCount(n: number): Promise<void> {
    await expect(this.rows).toHaveCount(n);
  }

  async expectRowVisible(name: string, opts: { timeout?: number } = {}): Promise<void> {
    await expect(this.cellByName(name)).toBeVisible(opts);
  }

  async expectRowHidden(name: string, opts: { timeout?: number } = {}): Promise<void> {
    await expect(this.cellByName(name)).toBeHidden(opts);
  }

  async clickRow(name: string): Promise<void> {
    await this.cellByName(name).click();
  }

  async roomOf(name: string): Promise<string> {
    return (await this.rowByName(name).locator("td").nth(1).innerText()).trim();
  }

  async selectedRowText(): Promise<string> {
    return (await this.selectedRows.first().innerText()).trim();
  }
}
