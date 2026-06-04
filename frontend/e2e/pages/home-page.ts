import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { HelpOverlay } from "./help-overlay";
import { ItemPanel } from "./item-panel";
import { ItemsTable } from "./items-table";
import { SearchBar } from "./search-bar";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";

export interface ItemFormOpts {
  name: string;
  category?: string;
  description?: string;
  notes?: string;
}

export class HomePage {
  readonly page: Page;
  readonly itemsTable: ItemsTable;
  readonly sidebar: Sidebar;
  readonly toolbar: Toolbar;
  readonly searchBar: SearchBar;
  readonly help: HelpOverlay;
  readonly newItemPanel: ItemPanel;
  readonly viewPanel: ItemPanel;
  readonly editPanel: ItemPanel;
  readonly newRoomPanel: ItemPanel;
  readonly newLocationPanel: ItemPanel;

  constructor(page: Page) {
    this.page = page;
    this.itemsTable = new ItemsTable(page);
    this.sidebar = new Sidebar(page);
    this.toolbar = new Toolbar(page);
    this.searchBar = new SearchBar(page);
    this.help = new HelpOverlay(page);
    this.newItemPanel = new ItemPanel(page, "new item");
    this.viewPanel = new ItemPanel(page, "detail ·");
    this.editPanel = new ItemPanel(page, "edit ·");
    this.newRoomPanel = new ItemPanel(page, "new room");
    this.newLocationPanel = new ItemPanel(page, "new location");
  }

  get accountButton(): Locator { return this.page.getByRole("button", { name: /account/i }); }
  get headerLink(): Locator { return this.page.getByRole("link", { name: /clutter :stock/i }); }
  get newItemButton(): Locator { return this.page.getByRole("button", { name: "+ New item" }); }

  // All non-retro tests run on the default ("system") theme. Retro themes
  // (tui/win98/cde) persist via localStorage["cs-theme"]; clearing it before
  // navigation guarantees we land on the standard chrome.
  async goto(path = "/"): Promise<void> {
    await this.page.addInitScript(() => {
      try {
        localStorage.removeItem("cs-theme");
      } catch {
        // localStorage can be unavailable in some contexts — ignore.
      }
    });
    await this.page.goto(path);
    // SSR sends fully-rendered HTML, so visible elements appear instantly — but
    // their click handlers don't fire until React Router hydrates. We can't wait
    // for "networkidle" as a hydration proxy: the live-updates EventSource
    // (/sse/items) holds a connection open indefinitely, so the network never
    // goes idle. Instead wait for the header's account / sign-in control, which
    // is rendered only after a client-only `mounted` flag flips true — a
    // reliable signal that hydration has run and handlers are attached.
    await this.page.waitForLoadState("domcontentloaded");
    await this.accountButton
      .or(this.page.getByRole("button", { name: "Sign in" }))
      .first()
      .waitFor({ state: "visible" });
  }

  // Click "+ New item" and walk through whichever panel chain shows up: when
  // the DB has no locations/rooms yet, the toolbar button opens
  // new-location → new-room → new-item rather than going straight to new-item.
  // This keeps tests robust against a freshly seeded dev database.
  async openNewItemFlow(): Promise<ItemPanel> {
    await this.newItemButton.click();

    if (await this.newLocationPanel.isVisible()) {
      await this.newLocationPanel.nameInput.fill(`E2E Loc-${Date.now()}`);
      await this.newLocationPanel.button("Create location").click();
      await this.newLocationPanel.expectHidden();
    }

    if (await this.newRoomPanel.isVisible()) {
      await this.newRoomPanel.nameInput.fill(`E2E Room-${Date.now()}`);
      await this.newRoomPanel.button("Create room").click();
      await this.newRoomPanel.expectHidden();
    }

    await this.newItemPanel.expectVisible();
    return this.newItemPanel;
  }

  async createItem(opts: ItemFormOpts): Promise<void> {
    const newPanel = await this.openNewItemFlow();
    await newPanel.fillForm(opts);
    await newPanel.button("Create item").click();

    // Verify success via the appearance of the row in the items table — the
    // API round-trip can take a couple of seconds.
    await this.itemsTable.expectRowVisible(opts.name, { timeout: 15_000 });

    // ItemEditPanel has a known race in its fetcher useEffect: when state
    // transitions from `submitting` straight to `idle` within a single React
    // batch, the effect doesn't observe the intermediate state and never calls
    // onSaved, leaving the new-item form stuck open even though the action
    // succeeded. Tolerate that by closing the panel manually if it didn't
    // auto-transition. The view panel is opened via a click on the row.
    if (await newPanel.isVisible()) {
      await newPanel.cancel();
    }
    if (!(await this.viewPanel.isVisible())) {
      await this.itemsTable.clickRow(opts.name);
      await this.viewPanel.expectVisible();
    }
  }

  // Delete the item currently shown in the view panel. Used for cleanup —
  // silently no-ops if the panel is already closed, so callers can re-run it.
  async deleteCurrentItem(): Promise<void> {
    if (!(await this.viewPanel.isVisible())) return;
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.viewPanel.button("Delete item").click();
    // Give the panel time to auto-close; if it doesn't, close it via × button.
    await this.viewPanel.expectHidden(5_000).catch(async () => {
      if (await this.viewPanel.isVisible()) {
        await this.viewPanel.close();
      }
    });
  }

  // Open an item by name via the inline search bar. Robust to the search bar
  // already being open and to a view panel already showing for that item
  // (the row click is a toggle and would otherwise close the open panel).
  async openItemByName(name: string): Promise<ItemPanel> {
    if (await this.viewPanel.isVisible()) {
      await this.viewPanel.close();
    }
    await this.searchBar.open();
    await this.searchBar.fill(name);
    await this.itemsTable.clickRow(name);
    await this.viewPanel.expectVisible();
    return this.viewPanel;
  }

  async expectAuthenticated(): Promise<void> {
    await expect(this.accountButton).toBeVisible();
  }

  // Open the user account modal and click Sign out. Does NOT wait for the
  // full /auth/signout → Authelia end-session → app redirect chain — the
  // caller decides what to assert (e.g. cookie-cleared, or URL-changed).
  async signOut(): Promise<void> {
    await this.accountButton.click();
    await this.page.getByRole("button", { name: "Sign out" }).click();
  }
}
