import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as OTPAuth from "otpauth";

export const authFile = fileURLToPath(
  new URL("../playwright/.auth/user.json", import.meta.url),
);

export const sessionFile = fileURLToPath(
  new URL("../playwright/.auth/session-storage.json", import.meta.url),
);

// Reuse cached storage state if it's younger than this. Keep well under the
// OIDC access-token lifetime so a cached session can't expire mid-test.
const AUTH_TTL_MS = 20 * 60 * 1000;

setup("authenticate", async ({ page }) => {
  if (fs.existsSync(authFile) && fs.existsSync(sessionFile)) {
    const ageMs = Date.now() - fs.statSync(authFile).mtimeMs;
    if (ageMs < AUTH_TTL_MS) return;
  }

  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "E2E_USERNAME and E2E_PASSWORD env vars must be set to run E2E tests",
    );
  }

  // Navigate to the app — unauthenticated, will redirect to Authelia
  await page.goto("/");
  await page.waitForURL(/auth\.wsh\.no/, { timeout: 15_000 });

  await page.getByRole("textbox", { name: /username/i }).fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for the 2FA page
  await page.waitForURL(/auth\.wsh\.no\/2fa/, { timeout: 10_000 });

  // Generate token just before filling — avoids a stale code if login was slow
  const totp = new OTPAuth.TOTP({
    secret: process.env.E2E_OTP_SECRET,
    digits: 6,
    period: 30,
  });
  const digits = totp.generate().split("");

  // Authelia renders 6 individual digit inputs; fills auto-advance and submit
  const otpInputs = page.getByRole("textbox", { name: /digit/i });
  for (let i = 0; i < digits.length; i++) {
    await otpInputs.nth(i).fill(digits[i]!);
  }

  // After OTP, Authelia redirects to either consent or directly back to the app
  await page.waitForURL(
    url => url.pathname.includes("/consent/") || url.hostname === "localhost",
    { timeout: 15_000 },
  );

  // Authelia shows a consent screen on first login or after scope changes
  if (page.url().includes("/consent/")) {
    await page.getByRole("button", { name: "Accept" }).click();
  }

  // Wait for the OIDC callback to fully process: the Account button appears once
  // the UserManager has stored the user and the app has re-rendered.
  await expect(page.getByRole("button", { name: /account/i })).toBeVisible({
    timeout: 20_000,
  });

  // Persist cookies (clutterstock_auth + authelia_session)
  await page.context().storageState({ path: authFile });

  // Persist sessionStorage (oidc.user:… token) keyed by origin — restored per-test
  // via addInitScript in fixtures.ts since Playwright storageState only captures localStorage.
  const sessionData = await page.evaluate(() => {
    const data: Record<string, string> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      data[key] = sessionStorage.getItem(key)!;
    }
    return data;
  });
  fs.mkdirSync(fileURLToPath(new URL("../playwright/.auth", import.meta.url)), {
    recursive: true,
  });
  fs.writeFileSync(
    sessionFile,
    JSON.stringify({ "http://localhost:5173": sessionData }, null, 2),
  );
});
