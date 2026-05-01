import { isApiProblem } from "~/api/problem";

export type FieldErrors = Record<string, string[]>;

export type ApiActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/**
 * Run a backend call from a route action and translate validation/auth
 * problems into a structured result so the form can re-render in place.
 *
 * Returns `{ ok: false }` for 4xx (except 404, which bubbles to the nearest
 * ErrorBoundary because the resource itself is missing). 5xx and network
 * failures rethrow so the ErrorBoundary catches them with full ProblemDetails.
 */
export async function tryApi<T>(fn: () => Promise<T>): Promise<ApiActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (isApiProblem(e) && e.status >= 400 && e.status < 500 && e.status !== 404) {
      return {
        ok: false,
        error: e.detail ?? e.title,
        fieldErrors: e.errors,
      };
    }
    throw e;
  }
}
