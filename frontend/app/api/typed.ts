import type { paths } from "~/api/types";
import { apiFetch } from "~/api/http";
import type { ProblemBody } from "~/api/problem";

type HttpMethod = "get" | "post" | "put" | "delete";

type PathsWithMethod<M extends HttpMethod> = {
  [P in keyof paths]: paths[P] extends Record<M, object> ? P : never;
}[keyof paths];

type Op<P extends keyof paths, M extends HttpMethod> = P extends keyof paths
  ? M extends keyof paths[P]
    ? paths[P][M]
    : never
  : never;

type RequestBody<O> = O extends {
  requestBody: { content: { "application/json": infer B } };
}
  ? B
  : never;

type SuccessBody<O> = O extends { responses: infer R }
  ? R extends { 200: { content: { "application/json": infer S } } }
    ? S
    : R extends { 201: { content: { "application/json": infer S } } }
      ? S
      : R extends { 204: unknown }
        ? void
        : unknown
  : unknown;

type PathParams<O> = O extends { parameters: { path: infer P } }
  ? P extends Record<string, unknown>
    ? P
    : never
  : never;

type HasPathParams<O> = O extends { parameters: { path: Record<string, unknown> } }
  ? true
  : false;

type HasBody<O> = O extends { requestBody: { content: unknown } } ? true : false;

export interface CallOptions<P extends keyof paths, M extends HttpMethod> {
  ssrRequest?: Request;
  signal?: AbortSignal;
}

type WithParams<P extends keyof paths, M extends HttpMethod> =
  HasPathParams<Op<P, M>> extends true
    ? { params: PathParams<Op<P, M>> }
    : { params?: never };

type WithBody<P extends keyof paths, M extends HttpMethod> =
  HasBody<Op<P, M>> extends true
    ? { body: RequestBody<Op<P, M>> }
    : { body?: never };

export type Options<P extends keyof paths, M extends HttpMethod> =
  CallOptions<P, M> & WithParams<P, M> & WithBody<P, M>;

function substitutePath(path: string, params?: Record<string, unknown>): string {
  if (!params) return path;
  return path.replace(/\{(\w+)\}/g, (_, key) => {
    const v = params[key];
    if (v === undefined || v === null) {
      throw new Error(`Missing path parameter "${key}" for ${path}`);
    }
    return encodeURIComponent(String(v));
  });
}

async function parseProblem(response: Response): Promise<ProblemBody | null> {
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("problem+json") && !ct.includes("application/json")) return null;
  try {
    return (await response.json()) as ProblemBody;
  } catch {
    return null;
  }
}

async function call<P extends keyof paths, M extends HttpMethod>(
  method: M,
  path: P,
  opts?: Options<P, M>,
): Promise<SuccessBody<Op<P, M>>> {
  const url = substitutePath(
    path as string,
    opts?.params as Record<string, unknown> | undefined,
  );

  const init: RequestInit = { method: method.toUpperCase(), signal: opts?.signal };
  if (opts && "body" in opts && opts.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(opts.body);
  }

  const response = await apiFetch(url, init, opts?.ssrRequest);

  if (!response.ok) {
    const body = await parseProblem(response);
    const fallback: ProblemBody = body ?? { title: response.statusText, status: response.status };
    // Throw a `Response` (not a custom Error) so RR7 serializes the body to the
    // client across SSR — `useRouteError` exposes the parsed body via `error.data`
    // and `isRouteErrorResponse(error)` returns true. Custom Error subclass
    // fields would be stripped by `serializeError`.
    throw new Response(JSON.stringify(fallback), {
      status: response.status,
      statusText: typeof fallback.title === "string"
        ? fallback.title.slice(0, 200)
        : response.statusText,
      headers: { "Content-Type": "application/problem+json" },
    });
  }

  if (response.status === 204) return undefined as SuccessBody<Op<P, M>>;
  return (await response.json()) as SuccessBody<Op<P, M>>;
}

export function get<P extends PathsWithMethod<"get">>(
  path: P,
  opts?: Options<P, "get">,
): Promise<SuccessBody<Op<P, "get">>> {
  return call("get", path, opts);
}

export function post<P extends PathsWithMethod<"post">>(
  path: P,
  opts?: Options<P, "post">,
): Promise<SuccessBody<Op<P, "post">>> {
  return call("post", path, opts);
}

export function put<P extends PathsWithMethod<"put">>(
  path: P,
  opts?: Options<P, "put">,
): Promise<SuccessBody<Op<P, "put">>> {
  return call("put", path, opts);
}

export function del<P extends PathsWithMethod<"delete">>(
  path: P,
  opts?: Options<P, "delete">,
): Promise<SuccessBody<Op<P, "delete">>> {
  return call("delete", path, opts);
}
