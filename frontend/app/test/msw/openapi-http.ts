import type { paths } from "~/api/types";
import { getApiBase } from "~/constants/api";
import { createOpenApiHttp } from "openapi-msw";

/**
 * Must match how `apiFetch` resolves URLs: absolute `VITE_API_URL`/`SERVER_API_URL`, else
 * same origin as the page (`/locations` → `http://localhost:<port>/locations` in jsdom).
 */
function openApiMswBaseUrl(): string | undefined {
  const trimmed = getApiBase().replace(/\/$/, "");
  if (trimmed !== "") {
    return trimmed;
  }
  const origin = globalThis.location?.origin;
  if (typeof origin === "string" && origin !== "null") {
    return origin;
  }
  return undefined;
}

const baseUrl = openApiMswBaseUrl();

/** MSW `http` factories typed from the same OpenAPI `paths` as `openapi-typescript`. */
export const apiHttp = createOpenApiHttp<paths>(
  baseUrl ? { baseUrl } : undefined,
);
