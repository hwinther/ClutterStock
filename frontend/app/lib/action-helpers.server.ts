import { ApiProblemError, isApiProblem, type ProblemBody } from "~/api/problem";

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
    const problem = await coerceProblem(e);
    if (problem && problem.status >= 400 && problem.status < 500 && problem.status !== 404) {
      return {
        ok: false,
        error: problem.detail ?? problem.title,
        fieldErrors: problem.errors,
      };
    }
    throw e;
  }
}

async function coerceProblem(e: unknown): Promise<ApiProblemError | null> {
  if (isApiProblem(e)) return e;
  // The typed wrapper throws a Response with the ProblemDetails body so the
  // payload survives RR7's SSR serialization on the loader path. Actions need
  // to read it back here.
  if (e instanceof Response) {
    let body: ProblemBody;
    try {
      body = (await e.clone().json()) as ProblemBody;
    } catch {
      body = { title: e.statusText, status: e.status };
    }
    return new ApiProblemError(e.status, body);
  }
  return null;
}
