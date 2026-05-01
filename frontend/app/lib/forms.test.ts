import { describe, expect, it } from "vitest";
import { fieldError } from "./forms";

describe("fieldError", () => {
  it("returns undefined when fieldErrors is missing", () => {
    expect(fieldError(undefined, "name")).toBeUndefined();
  });

  it("returns undefined when the field has no entry", () => {
    expect(fieldError({ Name: ["required"] }, "description")).toBeUndefined();
  });

  it("matches case-insensitively (PascalCase backend ↔ lowercase HTML id)", () => {
    expect(fieldError({ Name: ["required"] }, "name")).toBe("required");
    expect(fieldError({ LocationId: ["bad"] }, "locationid")).toBe("bad");
  });

  it("joins multiple messages with a comma", () => {
    expect(fieldError({ Name: ["too short", "missing"] }, "name")).toBe(
      "too short, missing",
    );
  });
});
