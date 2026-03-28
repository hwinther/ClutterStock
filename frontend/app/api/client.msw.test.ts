import { describe, expect, it } from "vitest";
import { getLocation, getLocations } from "./client";
import { apiHttp } from "~/test/msw/openapi-http";
import { testApiServer } from "~/test/msw/server";

describe("API client (MSW + openapi-msw)", () => {
  it("getLocations resolves with default empty list", async () => {
    await expect(getLocations()).resolves.toEqual([]);
  });

  it("getLocation returns null when the spec returns 404", async () => {
    await expect(getLocation(42)).resolves.toBeNull();
  });

  it("allows per-test overrides with typed handlers", async () => {
    testApiServer.use(
      apiHttp.get("/locations", ({ response }) =>
        response(200).json([
          { id: 1, name: "Home", description: "Main", createdAtUtc: "2024-01-01T00:00:00Z" },
        ]),
      ),
    );

    const locations = await getLocations();
    expect(locations).toHaveLength(1);
    expect(locations[0]).toMatchObject({
      id: 1,
      name: "Home",
      description: "Main",
    });
  });

  it("getLocation parses JSON when the handler returns 200", async () => {
    testApiServer.use(
      apiHttp.get("/locations/{id}", ({ params, response }) =>
        response(200).json({
          id: Number(params.id),
          name: "Garage",
          description: null,
          createdAtUtc: "2024-01-01T00:00:00Z",
        }),
      ),
    );

    await expect(getLocation(7)).resolves.toMatchObject({
      id: 7,
      name: "Garage",
    });
  });
});
