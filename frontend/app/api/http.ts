import { getValidToken } from "~/lib/oidc.server";
import { apiPathVersionPrefix, getApiBase } from "~/constants/api";

export type ApiLogEvent =
  | { kind: "request"; method: string; url: string }
  | { kind: "response"; method: string; url: string; status: number; durationMs: number }
  | { kind: "error"; method: string; url: string; error: unknown };

let logListener: ((e: ApiLogEvent) => void) | undefined;

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
 * All API traffic goes through the BFF (React Router SSR server).
 * Pass `ssrRequest` from every loader/action so the session cookie can be
 * resolved to a Bearer token server-side.  Browser-direct .NET calls are gone.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  ssrRequest?: Request,
): Promise<Response> {
  const url = resolveUrl(path);
  const method = (init.method ?? "GET").toUpperCase();

  const headers = new Headers(init.headers);

  if (ssrRequest) {
    const token = await getValidToken(ssrRequest);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  logListener?.({ kind: "request", method, url });
  if (import.meta.env.DEV) console.debug(`[api] ${method} ${url}`);

  const t0 = Date.now();

  try {
    const response = await fetch(url, { ...init, headers });
    const durationMs = Date.now() - t0;
    logListener?.({ kind: "response", method, url, status: response.status, durationMs });
    if (import.meta.env.DEV)
      console.debug(`[api] ${method} ${url} → ${response.status} (${durationMs}ms)`);

    if (response.status === 401) {
      // Session expired and refresh failed — redirect to sign-in from server
      throw new Response(null, { status: 302, headers: { Location: "/auth/signin" } });
    }

    return response;
  } catch (error) {
    if (error instanceof Response) throw error; // propagate redirects
    logListener?.({ kind: "error", method, url, error });
    console.error(`[api] ${method} ${url} failed`, error);
    throw error;
  }
}
