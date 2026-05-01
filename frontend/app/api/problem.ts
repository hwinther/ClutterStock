import type { components } from "~/api/types";

type ProblemDetails = components["schemas"]["Microsoft.AspNetCore.Mvc.ProblemDetails"];
type ValidationProblemDetails =
  components["schemas"]["Microsoft.AspNetCore.Http.HttpValidationProblemDetails"];

export type ProblemBody = ProblemDetails | ValidationProblemDetails;

export class ApiProblemError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly instance?: string;
  readonly type?: string;
  readonly errors?: Record<string, string[]>;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly raw: ProblemBody;

  constructor(status: number, body: ProblemBody) {
    const title = body.title ?? `HTTP ${status}`;
    super(body.detail ?? title);
    this.name = "ApiProblemError";
    this.status = status;
    this.title = title;
    this.detail = body.detail ?? undefined;
    this.instance = body.instance ?? undefined;
    this.type = body.type ?? undefined;
    this.errors = (body as ValidationProblemDetails).errors ?? undefined;
    const ext = body as { requestId?: unknown; traceId?: unknown };
    this.requestId = typeof ext.requestId === "string" ? ext.requestId : undefined;
    this.traceId = typeof ext.traceId === "string" ? ext.traceId : undefined;
    this.raw = body;
  }
}

export function isApiProblem(value: unknown): value is ApiProblemError {
  return value instanceof ApiProblemError;
}

interface RouteErrorResponseLike {
  status: number;
  statusText?: string;
  data?: unknown;
}

function isRouteErrorResponseLike(value: unknown): value is RouteErrorResponseLike {
  return (
    value != null &&
    typeof value === "object" &&
    typeof (value as { status?: unknown }).status === "number" &&
    "data" in value
  );
}

/**
 * Coerce any thrown value into an ApiProblemError when possible, regardless of
 * how it survived (or did not survive) RR7's SSR serialization. Use this in
 * route ErrorBoundaries — the typed wrapper throws a `Response` for HTTP
 * failures, which RR7 hands back as a route ErrorResponse with `data` holding
 * the parsed ProblemBody.
 */
export function asApiProblem(error: unknown): ApiProblemError | null {
  if (isApiProblem(error)) return error;
  if (isRouteErrorResponseLike(error)) {
    const data = error.data;
    let body: ProblemBody | null = null;
    if (data && typeof data === "object") {
      body = data as ProblemBody;
    } else if (typeof data === "string" && data.length > 0) {
      try {
        body = JSON.parse(data) as ProblemBody;
      } catch {
        body = null;
      }
    }
    if (body) return new ApiProblemError(error.status, body);
  }
  return null;
}
