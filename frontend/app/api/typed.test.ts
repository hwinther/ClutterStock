import { describe, expect, it } from "vitest";
import { get, post, put, del } from "./typed";
import { asApiProblem } from "./problem";
import { apiHttp } from "~/test/msw/openapi-http";
import { testApiServer } from "~/test/msw/server";

describe("typed wrapper", () => {
  it("substitutes path params and parses a 200 JSON body", async () => {
    testApiServer.use(
      apiHttp.get("/api/v1/locations/{id}", ({ params, response }) =>
        response(200).json({
          id: Number(params.id),
          name: "Garage",
          description: null,
          createdAtUtc: "2024-01-01T00:00:00Z",
        }),
      ),
    );

    const result = await get("/api/v1/locations/{id}", { params: { id: 7 } });
    expect(result).toMatchObject({ id: 7, name: "Garage" });
  });

  it("posts a typed body and parses the 201 response", async () => {
    testApiServer.use(
      apiHttp.post("/api/v1/locations", async ({ request, response }) => {
        const body = (await request.json()) as { name?: string };
        return response(201).json({
          id: 1,
          name: body.name ?? "",
          description: null,
          createdAtUtc: "2024-01-01T00:00:00Z",
        });
      }),
    );

    const result = await post("/api/v1/locations", {
      body: { name: "Office", description: "HQ" },
    });
    expect(result).toMatchObject({ id: 1, name: "Office" });
  });

  it("throws Response carrying the ProblemDetails body on a 400", async () => {
    testApiServer.use(
      apiHttp.post("/api/v1/locations", ({ response }) =>
        response(400).json({
          type: "https://tools.ietf.org/html/rfc9110#section-15.5.1",
          title: "One or more validation errors occurred.",
          status: 400,
          errors: { Name: ["The Name field is required."] },
        }),
      ),
    );

    try {
      await post("/api/v1/locations", { body: { name: "" } });
      throw new Error("expected throw");
    } catch (e) {
      // The wrapper throws a Response so RR7 can surface .data on the boundary.
      expect(e).toBeInstanceOf(Response);
      const res = e as Response;
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body).toMatchObject({
        title: "One or more validation errors occurred.",
        errors: { Name: ["The Name field is required."] },
      });
    }
  });

  it("preserves requestId/traceId from ProblemDetails extensions", async () => {
    testApiServer.use(
      apiHttp.get("/api/v1/locations/{id}", ({ response }) =>
        // ProblemDetails has an open `& { [key: string]: unknown }` extension
        // shape, which is where the backend stuffs requestId / traceId
        // (see Program.cs CustomizeProblemDetails).
        response(500).json({
          title: "Server error",
          status: 500,
          requestId: "0HN42",
          traceId: "00-trace-id-99",
        }),
      ),
    );

    try {
      await get("/api/v1/locations/{id}", { params: { id: 1 } });
      throw new Error("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(Response);
      // asApiProblem normalises both Response and ApiProblemError into the
      // same boundary-friendly shape — and pulls extension fields out.
      const body = await (e as Response).json();
      const fakeRouteError = { status: 500, statusText: "Server error", data: body };
      const problem = asApiProblem(fakeRouteError);
      expect(problem).not.toBeNull();
      expect(problem!.requestId).toBe("0HN42");
      expect(problem!.traceId).toBe("00-trace-id-99");
    }
  });

  it("returns void for a 204 DELETE", async () => {
    testApiServer.use(
      apiHttp.delete("/api/v1/locations/{id}", ({ response }) => response(204).empty()),
    );

    const result = await del("/api/v1/locations/{id}", { params: { id: 1 } });
    expect(result).toBeUndefined();
  });

  it("PUT round-trips a typed body and parses 200", async () => {
    testApiServer.use(
      apiHttp.put("/api/v1/locations/{id}", async ({ params, request, response }) => {
        const body = (await request.json()) as { name?: string };
        return response(200).json({
          id: Number(params.id),
          name: body.name ?? "",
          description: null,
          createdAtUtc: "2024-01-01T00:00:00Z",
          updatedAtUtc: "2024-01-02T00:00:00Z",
        });
      }),
    );

    const result = await put("/api/v1/locations/{id}", {
      params: { id: 3 },
      body: { name: "Renamed" },
    });
    expect(result).toMatchObject({ id: 3, name: "Renamed" });
  });
});
