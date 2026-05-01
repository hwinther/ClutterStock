import { describe, expect, it } from "vitest";
import { ApiProblemError, asApiProblem, isApiProblem } from "./problem";

describe("ApiProblemError", () => {
  it("uses title for message when detail is missing", () => {
    const err = new ApiProblemError(500, { title: "Server error" });
    expect(err.message).toBe("Server error");
    expect(err.title).toBe("Server error");
    expect(err.status).toBe(500);
    expect(err.detail).toBeUndefined();
  });

  it("prefers detail for message when both are present", () => {
    const err = new ApiProblemError(400, {
      title: "One or more validation errors occurred.",
      detail: "Name is required",
    });
    expect(err.message).toBe("Name is required");
    expect(err.detail).toBe("Name is required");
  });

  it("falls back to a synthetic title when the body has none", () => {
    const err = new ApiProblemError(503, {});
    expect(err.title).toBe("HTTP 503");
  });

  it("extracts validation errors", () => {
    const err = new ApiProblemError(400, {
      title: "Validation failed",
      errors: { Name: ["The Name field is required."] },
    });
    expect(err.errors).toEqual({ Name: ["The Name field is required."] });
  });

  it("pulls requestId and traceId out of ProblemDetails extensions", () => {
    const err = new ApiProblemError(500, {
      title: "Server error",
      // open extension bag — requestId/traceId are added by Program.cs
      requestId: "0HN2",
      traceId: "00-abcd-efgh-01",
    } as Record<string, unknown>);
    expect(err.requestId).toBe("0HN2");
    expect(err.traceId).toBe("00-abcd-efgh-01");
  });

  it("ignores non-string requestId/traceId values", () => {
    const err = new ApiProblemError(500, {
      title: "Server error",
      requestId: 42,
      traceId: { not: "a string" },
    } as unknown as Record<string, unknown>);
    expect(err.requestId).toBeUndefined();
    expect(err.traceId).toBeUndefined();
  });

  it("preserves the raw body for downstream inspection", () => {
    const body = { title: "x", detail: "y", instance: "/foo" };
    const err = new ApiProblemError(400, body);
    expect(err.raw).toBe(body);
    expect(err.instance).toBe("/foo");
  });
});

describe("isApiProblem", () => {
  it("returns true only for ApiProblemError instances", () => {
    expect(isApiProblem(new ApiProblemError(500, { title: "x" }))).toBe(true);
    expect(isApiProblem(new Error("plain"))).toBe(false);
    expect(isApiProblem({ status: 500 })).toBe(false);
    expect(isApiProblem(null)).toBe(false);
  });
});

describe("asApiProblem", () => {
  it("returns the same instance when given an ApiProblemError", () => {
    const err = new ApiProblemError(400, { title: "x" });
    expect(asApiProblem(err)).toBe(err);
  });

  it("rebuilds an ApiProblemError from a RR7 ErrorResponse with object data", () => {
    const routeError = {
      status: 400,
      statusText: "Bad Request",
      data: { title: "Validation failed", errors: { Name: ["required"] } },
    };
    const problem = asApiProblem(routeError);
    expect(problem).not.toBeNull();
    expect(problem!.status).toBe(400);
    expect(problem!.title).toBe("Validation failed");
    expect(problem!.errors).toEqual({ Name: ["required"] });
  });

  it("parses string data as JSON when present", () => {
    const routeError = {
      status: 500,
      statusText: "Server error",
      data: JSON.stringify({ title: "Boom", requestId: "rid-1" }),
    };
    const problem = asApiProblem(routeError);
    expect(problem).not.toBeNull();
    expect(problem!.requestId).toBe("rid-1");
  });

  it("returns null for unrelated errors", () => {
    expect(asApiProblem(new Error("plain"))).toBeNull();
    expect(asApiProblem(null)).toBeNull();
    expect(asApiProblem({ status: 500 })).toBeNull(); // missing data
  });
});
