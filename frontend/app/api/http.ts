import { apiPathVersionPrefix, getApiBase } from "~/constants/api";

export type ApiHeaderProvider = () =>
  | HeadersInit
  | undefined
  | Promise<HeadersInit | undefined>;

let headerProvider: ApiHeaderProvider | undefined;

/**
 * Merge headers into every API request (e.g. Authorization).
 * Call from app bootstrap when you have auth (e.g. entry.client.tsx).
 */
export function setApiHeaderProvider(
  provider: ApiHeaderProvider | undefined,
): void {
  headerProvider = provider;
}

export type ApiLogEvent =
  | { kind: "request"; method: string; url: string }
  | {
      kind: "response";
      method: string;
      url: string;
      status: number;
      durationMs: number;
    }
  | { kind: "error"; method: string; url: string; error: unknown };

let logListener: ((e: ApiLogEvent) => void) | undefined;

/** Optional structured logging / metrics for all API traffic. */
export function setApiLogListener(
  listener: ((e: ApiLogEvent) => void) | undefined,
): void {
  logListener = listener;
}

function resolveUrl(path: string): string {
  const base = getApiBase().replace(/\/$/, "");
  const p = path.replace(/^\//, "");
  const versionedPath = `${apiPathVersionPrefix}/${p}`;
  return base ? `${base}/${versionedPath}` : `/${versionedPath}`;
}

/**
 * Single entry point for backend HTTP. Use this (via ~/api/client helpers)
 * so auth, logging, and tracing stay in one place.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = resolveUrl(path);
  const method = (init.method ?? "GET").toUpperCase();

  const headers = new Headers(init.headers);
  if (headerProvider) {
    const extra = await headerProvider();
    if (extra) {
      new Headers(extra).forEach((value, key) => {
        headers.set(key, value);
      });
    }
  }

  logListener?.({ kind: "request", method, url });
  if (import.meta.env.DEV) {
    console.debug(`[api] ${method} ${url}`);
  }

  const t0 =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

  try {
    const response = await fetch(url, { ...init, headers });
    const durationMs =
      (typeof performance !== "undefined" &&
      typeof performance.now === "function"
        ? performance.now()
        : Date.now()) - t0;
    logListener?.({
      kind: "response",
      method,
      url,
      status: response.status,
      durationMs,
    });
    if (import.meta.env.DEV) {
      console.debug(
        `[api] ${method} ${url} → ${response.status} (${durationMs.toFixed(0)}ms)`,
      );
    }
    return response;
  } catch (error) {
    logListener?.({ kind: "error", method, url, error });
    console.error(`[api] ${method} ${url} failed`, error);
    throw error;
  }
}
