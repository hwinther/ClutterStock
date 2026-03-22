/**
 * Browser: `VITE_API_URL` is inlined at build time (public URL or proxy path).
 *
 * SSR (Node in Docker/K8s): use `SERVER_API_URL` or `API_URL` so requests use a
 * reachable base (e.g. `http://my-api:8080`). If those are unset and `VITE_API_URL`
 * was empty at build time, `fetch("/locations")` resolves to localhost and fails
 * with ECONNREFUSED inside the pod.
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
