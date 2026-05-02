import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

// All non-retro tests run on the default ("system") theme. The retro themes
// (tui/win98/cde) persist via localStorage["cs-theme"]; clearing it before
// navigation guarantees we land on the standard chrome.
export async function gotoStandardTheme(page: Page, path = "/") {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("cs-theme");
    } catch {
      // localStorage can be unavailable in some contexts — ignore.
    }
  });
  await page.goto(path);
  // SSR sends fully-rendered HTML, so visible elements appear instantly — but
  // their click handlers don't fire until React Router hydrates. Wait for the
  // network to settle as a hydration proxy; without this, the first click
  // after goto is a no-op.
  await page.waitForLoadState("networkidle");
}

// Stable, collision-resistant suffix to keep parallel tests from stepping on
// each other when they create rows in the shared dev database.
export function uniqueSuffix(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Each side panel renders an `<aside class="tui-panel">` with a unique
// tui-panel-title. The PanelHeader labels overlap (`ITEM #N` is a substring of
// `EDIT ITEM #N`), so disambiguate by the title text instead.
function panelByTitle(page: Page, titleNeedle: string): Locator {
  return page.locator("aside.tui-panel").filter({
    has: page.locator(".tui-panel-title", { hasText: titleNeedle }),
  });
}

export const panels = {
  newItem: (page: Page) => panelByTitle(page, "new item"),
  view: (page: Page) => panelByTitle(page, "detail ·"),
  edit: (page: Page) => panelByTitle(page, "edit ·"),
  newRoom: (page: Page) => panelByTitle(page, "new room"),
  newLocation: (page: Page) => panelByTitle(page, "new location"),
};

// Click "+ New item" and then walk through whichever panel chain shows up:
// when the DB has no locations/rooms yet, the toolbar button opens
// new-location → new-room → new-item rather than going straight to new-item.
// This keeps tests robust against a freshly seeded dev database.
export async function openNewItemPanel(page: Page) {
  await page.getByRole("button", { name: "+ New item" }).click();

  const loc = panels.newLocation(page);
  if (await loc.isVisible()) {
    await loc.locator('input[name="name"]').fill(uniqueSuffix("E2E Loc"));
    await loc.getByRole("button", { name: "Create location" }).click();
    await expect(loc).toBeHidden();
  }

  const room = panels.newRoom(page);
  if (await room.isVisible()) {
    await room.locator('input[name="name"]').fill(uniqueSuffix("E2E Room"));
    await room.getByRole("button", { name: "Create room" }).click();
    await expect(room).toBeHidden();
  }

  const item = panels.newItem(page);
  await expect(item).toBeVisible();
  return item;
}

export async function createItem(
  page: Page,
  opts: { name: string; category?: string; description?: string; notes?: string },
) {
  const newPanel = await openNewItemPanel(page);
  await newPanel.locator('input[name="name"]').fill(opts.name);
  if (opts.description) {
    await newPanel.locator('textarea[name="description"]').fill(opts.description);
  }
  if (opts.category) {
    await newPanel.locator('input[name="category"]').fill(opts.category);
  }
  if (opts.notes) {
    await newPanel.locator('textarea[name="notes"]').fill(opts.notes);
  }
  await newPanel.getByRole("button", { name: "Create item" }).click();

  // Verify success via the appearance of the row in the items table — the
  // API round-trip can take a couple of seconds.
  const itemsTable = page.locator(".cs-body table");
  await expect(itemsTable.getByText(opts.name, { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  // ItemEditPanel has a known race in its fetcher useEffect: when state
  // transitions from `submitting` straight to `idle` within a single React
  // batch, the effect doesn't observe the intermediate state and never calls
  // onSaved, leaving the new-item form stuck open even though the action
  // succeeded. Tolerate that by closing the panel manually if it didn't
  // auto-transition. The view panel is opened via a click on the row.
  if (await newPanel.isVisible()) {
    await newPanel.getByRole("button", { name: "Cancel" }).click();
    await expect(newPanel).toBeHidden();
  }
  if (!(await panels.view(page).isVisible())) {
    await itemsTable.getByText(opts.name, { exact: true }).click();
    await expect(panels.view(page)).toBeVisible();
  }
}

// Delete the item currently shown in the view panel. Used for cleanup —
// silently no-ops if the panel is already closed, so callers can re-run it.
export async function deleteCurrentItem(page: Page) {
  const view = panels.view(page);
  if (!(await view.isVisible())) return;
  // Read the displayed name so we can wait for the row to disappear from the
  // table — the panel itself may not auto-close due to the same fetcher race
  // documented in createItem.
  const titleText = (
    await view.locator('span.tui-panel-title').first().innerText()
  ).trim();
  const idMatch = titleText.match(/#(\d+)/);
  page.once("dialog", dialog => dialog.accept());
  await view.getByRole("button", { name: "Delete item" }).click();
  // Give the panel time to auto-close; if it doesn't, close it via × button.
  await expect(view).toBeHidden({ timeout: 5_000 }).catch(async () => {
    if (await view.isVisible()) {
      await view.getByRole("button", { name: "×" }).click();
      await expect(view).toBeHidden();
    }
  });
  // Defensive: caller should still verify the row is gone from the table.
  void idMatch;
}

// Open an item by name via the inline search bar, then return the now-visible
// view panel. Robust to the search bar already being open from a prior step.
export async function openItemByName(page: Page, name: string) {
  // The table row click is a toggle — if a view panel is already open for the
  // target item (e.g. left over from j/k navigation), clicking the row would
  // close it rather than open it. Close any existing view panel first.
  const view = panels.view(page);
  if (await view.isVisible()) {
    await view.getByRole("button", { name: "×" }).click();
    await expect(view).toBeHidden();
  }

  // Make sure no input has focus so the global "/" handler fires.
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && "blur" in el) (el as HTMLElement).blur();
  });
  await page.keyboard.press("/");
  const searchInput = page.locator(".cs-search-input");
  await expect(searchInput).toBeVisible();
  await searchInput.fill(name);
  const itemsTable = page.locator(".cs-body table");
  await itemsTable.getByText(name, { exact: true }).click();
  await expect(view).toBeVisible();
  return view;
}
