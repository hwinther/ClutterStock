import { describe, expect, it } from "vitest";
import { tryApi } from "./action-helpers.server";
import { ApiProblemError } from "~/api/problem";

describe("tryApi", () => {
  it("returns ok with data on success", async () => {
    const result = await tryApi(async () => ({ id: 1, name: "Home" }));
    expect(result).toEqual({ ok: true, data: { id: 1, name: "Home" } });
  });

  it("turns a 400 ApiProblemError into a structured failure", async () => {
    const result = await tryApi(async () => {
      throw new ApiProblemError(400, {
        title: "Bad Request",
        detail: "Name is required",
        errors: { Name: ["required"] },
      });
    });
    expect(result).toEqual({
      ok: false,
      error: "Name is required",
      fieldErrors: { Name: ["required"] },
    });
  });

  it("falls back to title when detail is absent", async () => {
    const result = await tryApi(async () => {
      throw new ApiProblemError(403, { title: "Forbidden" });
    });
    expect(result).toMatchObject({ ok: false, error: "Forbidden" });
  });

  it("rethrows 404 so the ErrorBoundary can show a not-found page", async () => {
    await expect(
      tryApi(async () => {
        throw new ApiProblemError(404, { title: "Not Found" });
      }),
    ).rejects.toBeInstanceOf(ApiProblemError);
  });

  it("rethrows 5xx so the ErrorBoundary can show ProblemDetails", async () => {
    await expect(
      tryApi(async () => {
        throw new ApiProblemError(500, { title: "Server error" });
      }),
    ).rejects.toBeInstanceOf(ApiProblemError);
  });

  it("rethrows non-Problem errors untouched", async () => {
    const boom = new Error("network");
    await expect(
      tryApi(async () => {
        throw boom;
      }),
    ).rejects.toBe(boom);
  });

  it("translates a thrown Response (the typed wrapper's actual throw) into a structured failure", async () => {
    const body = {
      title: "One or more validation errors occurred.",
      status: 400,
      errors: { Name: ["The Name field is required."] },
    };
    const result = await tryApi(async () => {
      throw new Response(JSON.stringify(body), {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });
    });
    expect(result).toEqual({
      ok: false,
      error: "One or more validation errors occurred.",
      fieldErrors: { Name: ["The Name field is required."] },
    });
  });

  it("rethrows a 500 Response so the ErrorBoundary owns it", async () => {
    const res = new Response(JSON.stringify({ title: "Boom" }), {
      status: 500,
      headers: { "Content-Type": "application/problem+json" },
    });
    await expect(
      tryApi(async () => {
        throw res;
      }),
    ).rejects.toBe(res);
  });
});
