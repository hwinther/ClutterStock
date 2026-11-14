import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { relativeTime } from "./time";

const NOW = Date.parse("2026-06-15T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a dash without a timestamp", () => {
    expect(relativeTime()).toBe("—");
    expect(relativeTime(null)).toBe("—");
    expect(relativeTime("")).toBe("—");
  });

  it.each([
    [30_000, "just now"],
    [MIN, "1m ago"],
    [59 * MIN, "59m ago"],
    [HOUR, "1h ago"],
    [23 * HOUR, "23h ago"],
    [DAY, "1d ago"],
    [6 * DAY, "6d ago"],
    [7 * DAY, "1w ago"],
    [29 * DAY, "4w ago"],
    [30 * DAY, "1mo ago"],
    [364 * DAY, "12mo ago"],
    [365 * DAY, "1y ago"],
    [800 * DAY, "2y ago"],
  ])("%d ms ago reads %s", (ms, expected) => {
    expect(relativeTime(ago(ms))).toBe(expected);
  });
});
