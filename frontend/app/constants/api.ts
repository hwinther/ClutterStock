/**
 * Browser: `VITE_API_URL` is inlined at build time (public URL or proxy path).
 *
 * SSR (Node in Docker/K8s): use `SERVER_API_URL` or `API_URL` so requests use a
 * reachable base (e.g. `http://my-api:8080`). If those are unset and `VITE_API_URL`
 * was empty at build time, relative fetches resolve to the SSR host and may fail
 * with ECONNREFUSED inside the pod.
 *
 * Resource paths passed to `apiFetch` are relative to this prefix (e.g. `locations`
 * → `/api/v1/locations`), matching the backend minimal API group.
 */
export const apiPathVersionPrefix = "api/v1";

/**
 * Optional origin or base URL **without** trailing slash and **without** the
 * `/api/v1` segment; that segment is added by `~/api/http` for all API calls.
 */
export function getApiBase(): string {
  if (globalThis.window === undefined) {
    return (
      process.env.SERVER_API_URL ??
      process.env.API_URL ??
      import.meta.env.VITE_API_URL ??
      ""
    );
  }
  return import.meta.env.VITE_API_URL ?? "";
}
