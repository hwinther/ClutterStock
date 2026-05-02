import type { Locator, Page } from "@playwright/test";

// The sidebar's first aside is the rooms panel. Room/category buttons have
// accessible names of the form "<label> <count>".
export class Sidebar {
  readonly page: Page;
  readonly root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.locator(".cs-body aside.tui-panel").first();
  }

  roomButton(name: string): Locator {
    return this.root.getByRole("button", { name: new RegExp(`^${escape(name)}\\s+\\d+$`) });
  }

  categoryButton(name: string): Locator {
    return this.root.getByRole("button", { name: new RegExp(`^${escape(name)}\\s+\\d+$`) });
  }

  async clickRoom(name: string): Promise<void> {
    await this.roomButton(name).first().click();
  }

  async clickCategory(name: string): Promise<void> {
    await this.categoryButton(name).first().click();
  }
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
