import { authFile } from "./auth-paths";
import { test } from "./fixtures";
import { uniqueSuffix } from "./helpers";
import { HomePage } from "./pages/home-page";

/**
 * SSE live updates: an item created in one browser session appears in another
 * session's "All items" view without that session navigating or reloading.
 *
 * Both sessions sit on the default home view (no room/category filter), where
 * the loader returns every item — so a revalidation triggered by the `/sse/items`
 * stream surfaces the new row. This exercises the full chain: backend publish →
 * Redis → SSR SSE relay → browser EventSource → React Router revalidation.
 */
test("an item created by one user appears in another user's open view", async ({
  home,
  browser,
}) => {
  await home.goto();
  await home.expectAuthenticated();

  // Second, independent session viewing the same default "All items" list.
  const observerContext = await browser.newContext({ storageState: authFile });
  try {
    const observer = new HomePage(await observerContext.newPage());
    await observer.goto();
    await observer.expectAuthenticated();

    const itemName = uniqueSuffix("SSE Live");

    // Create in the first session. The observer never reloads — the row can
    // only appear via the SSE-driven revalidation.
    await home.createItem({ name: itemName, description: "pushed via SSE" });

    await observer.itemsTable.expectRowVisible(itemName, { timeout: 20_000 });

    // Cleanup: remove the item so the shared dev DB doesn't accumulate rows.
    await home.deleteCurrentItem();
  } finally {
    await observerContext.close();
  }
});
