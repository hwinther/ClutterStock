import type { Page } from "playwright";
import { applyAuth } from "../auth";

interface VuContext {
  vars: Record<string, unknown>;
}

interface Events {
  emit(event: "counter" | "rate" | "histogram", name: string, value: number): void;
}

// Artillery's playwright engine invokes this per VU. `page` is a fresh Page in
// a fresh BrowserContext — we attach the cached Authelia session before the
// first navigation, then walk a smoke flow that mirrors e2e/smoke.spec.ts plus
// a search interaction. Keep the steps cheap; load runs measure how the SSR
// frontend handles N concurrent users, not feature coverage.
export async function homeFlow(
  page: Page,
  _vuContext: VuContext,
  events: Events,
): Promise<void> {
  await applyAuth(page);

  const t0 = Date.now();
  await page.goto("/", { waitUntil: "networkidle" });
  events.emit("histogram", "clutterstock.home.goto_ms", Date.now() - t0);

  // Auth-confirmed gate: if this fails the cached session was rejected and the
  // SSR redirected to Authelia — no point measuring further.
  await page.getByRole("button", { name: /account/i }).waitFor({ timeout: 15_000 });

  // Stats panel == real data fetched from the API. Failing here means the
  // SSR loader couldn't reach the backend, surfacing API saturation.
  await page.getByText("Total items").waitFor({ timeout: 10_000 });

  // Open the inline search bar and type a partial query. We don't submit —
  // the goal is to exercise the React state path and any debounced fetch,
  // not to assert specific results (the test DB content isn't pinned).
  await page.evaluate(() => {
    const el = document.activeElement;
    if (el && "blur" in el) (el as HTMLElement).blur();
  });
  await page.keyboard.press("/");
  const search = page.locator(".cs-search-input");
  await search.waitFor({ timeout: 5_000 });
  await search.fill("e2e");
  await search.press("Escape");
}
