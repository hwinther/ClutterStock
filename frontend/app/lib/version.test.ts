import { afterEach, describe, expect, it, vi } from "vitest";
import { getVersionLine } from "./version";

describe("getVersionLine", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins the version and the short sha", () => {
    vi.stubEnv("VITE_APP_VERSION", "1.4.2");
    vi.stubEnv("VITE_GIT_SHA", "0123456789abcdef");
    expect(getVersionLine()).toEqual({ line: "1.4.2 · 0123456", sha: "0123456789abcdef" });
  });

  it("shows only what is set", () => {
    vi.stubEnv("VITE_APP_VERSION", "");
    vi.stubEnv("VITE_GIT_SHA", "abcdef0123");
    expect(getVersionLine().line).toBe("abcdef0");
  });

  it("says dev in development and nothing in a build without version info", () => {
    vi.stubEnv("VITE_APP_VERSION", "");
    vi.stubEnv("VITE_GIT_SHA", "");
    vi.stubEnv("DEV", true);
    expect(getVersionLine()).toEqual({ line: "dev", sha: "" });
    vi.stubEnv("DEV", false);
    expect(getVersionLine().line).toBe("");
  });
});
