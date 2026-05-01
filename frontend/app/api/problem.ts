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
