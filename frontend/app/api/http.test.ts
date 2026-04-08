import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

const { getApiBaseMock } = vi.hoisted(() => ({
  getApiBaseMock: vi.fn(() => ""),
}));

vi.mock("~/constants/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/constants/api")>();
  return {
    ...actual,
    getApiBase: () => getApiBaseMock(),
  };
});

import { apiFetch, setApiHeaderProvider, setApiLogListener } from "./http";

function resetHttpModuleState(): void {
  setApiHeaderProvider(undefined);
  setApiLogListener(undefined);
}

describe("apiFetch", () => {
  let fetchMock: Mock;

  function lastFetchInit(): RequestInit {
    const call = fetchMock.mock.calls.at(-1);
    const init = call?.[1];
    expect(init).toBeDefined();
    return init as RequestInit;
  }

  beforeEach(() => {
    getApiBaseMock.mockReset();
    getApiBaseMock.mockImplementation(() => "");
    resetHttpModuleState();
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    resetHttpModuleState();
    vi.unstubAllGlobals();
  });

  it("resolves URL with no base as root-relative path", async () => {
    getApiBaseMock.mockReturnValue("");
    await apiFetch("locations");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/locations",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("strips leading slash on path when base is set", async () => {
    getApiBaseMock.mockReturnValue("https://api.example.com");
    await apiFetch("/foo/bar");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/foo/bar",
      expect.anything(),
    );
  });

  it("trims trailing slash from base", async () => {
    getApiBaseMock.mockReturnValue("https://api.example.com/");
    await apiFetch("x");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/x",
      expect.anything(),
    );
  });

  it("defaults method to GET", async () => {
    await apiFetch("/a");
    expect(lastFetchInit().method).toBeUndefined();
  });

  it("merges sync header provider into request headers", async () => {
    setApiHeaderProvider(() => ({ Authorization: "Bearer x" }));
    await apiFetch("/a", {
      headers: { "X-App": "1" },
    });
    const h = new Headers(lastFetchInit().headers);
    expect(h.get("X-App")).toBe("1");
    expect(h.get("Authorization")).toBe("Bearer x");
  });

  it("merges async header provider into request headers", async () => {
    setApiHeaderProvider(async () => ({ Authorization: "Bearer async" }));
    await apiFetch("/a");
    expect(new Headers(lastFetchInit().headers).get("Authorization")).toBe(
      "Bearer async",
    );
  });

  it("skips merge when provider returns undefined", async () => {
    setApiHeaderProvider(() => undefined);
    await apiFetch("/a", { headers: { "X-Only": "y" } });
    const h = new Headers(lastFetchInit().headers);
    expect(h.get("X-Only")).toBe("y");
    expect(h.get("Authorization")).toBeNull();
  });

  it("emits request then response log events on success", async () => {
    const kinds: string[] = [];
    setApiLogListener((e) => {
      kinds.push(e.kind);
    });
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));

    await apiFetch("/z", { method: "post" });

    expect(kinds).toEqual(["request", "response"]);
  });

  it("response log event includes HTTP status", async () => {
    let status: number | undefined;
    setApiLogListener((e) => {
      if (e.kind === "response") status = e.status;
    });
    fetchMock.mockResolvedValue(new Response(null, { status: 418 }));
    await apiFetch("/tea");
    expect(status).toBe(418);
  });

  it("emits request then error log event when fetch throws", async () => {
    const err = new Error("network");
    fetchMock.mockRejectedValue(err);
    const kinds: string[] = [];
    let loggedError: unknown;
    setApiLogListener((e) => {
      kinds.push(e.kind);
      if (e.kind === "error") loggedError = e.error;
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(apiFetch("/fail")).rejects.toThrow("network");

    expect(kinds).toEqual(["request", "error"]);
    expect(loggedError).toBe(err);

    consoleSpy.mockRestore();
  });
});
