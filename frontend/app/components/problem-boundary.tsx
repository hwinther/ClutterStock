import { isRouteErrorResponse } from "react-router";
import { asApiProblem } from "~/api/problem";

interface ProblemBoundaryProps {
  readonly error: unknown;
  readonly scope?: "page" | "section";
}

interface RenderShape {
  title: string;
  detail: string;
  status?: number;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
  traceId?: string;
  stack?: string;
}

function shapeFromError(error: unknown): RenderShape {
  // The typed wrapper throws Response with a ProblemDetails JSON body, which
  // RR7 surfaces as a route ErrorResponse. asApiProblem unwraps either.
  const problem = asApiProblem(error);
  if (problem) {
    return {
      title: problem.title,
      detail: problem.detail ?? problem.message,
      status: problem.status,
      fieldErrors: problem.errors,
      requestId: problem.requestId,
      traceId: problem.traceId,
    };
  }

  if (isRouteErrorResponse(error)) {
    return {
      title: error.status === 404 ? "Not found" : `Error ${error.status}`,
      detail:
        error.status === 404
          ? "The requested page could not be found."
          : error.statusText || "An unexpected error occurred.",
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      title: "Unexpected error",
      detail: import.meta.env.DEV ? error.message : "An unexpected error occurred.",
      stack: import.meta.env.DEV ? error.stack : undefined,
    };
  }

  return { title: "Unexpected error", detail: "An unexpected error occurred." };
}

export function ProblemBoundary({ error, scope = "page" }: ProblemBoundaryProps) {
  const s = shapeFromError(error);

  return (
    <div
      role="alert"
      style={{
        margin: scope === "page" ? "2rem auto" : "1rem 0",
        maxWidth: scope === "page" ? "40rem" : undefined,
        padding: "1rem 1.25rem",
        background: "var(--c-bg-2)",
        color: "var(--c-fg)",
        border: "1px solid var(--c-border)",
        borderLeft: "3px solid var(--c-danger)",
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: "0.25rem",
          fontSize: "1.125rem",
          color: "var(--c-fg)",
        }}
      >
        {s.title}
      </h2>
      <p style={{ margin: 0, color: "var(--c-fg-2)" }}>{s.detail}</p>

      {s.fieldErrors && (
        <ul
          style={{
            marginTop: "0.5rem",
            paddingLeft: "1.25rem",
            color: "var(--c-fg-2)",
          }}
        >
          {Object.entries(s.fieldErrors).map(([field, msgs]) => (
            <li key={field}>
              <strong style={{ color: "var(--c-fg)" }}>{field}:</strong> {msgs.join(", ")}
            </li>
          ))}
        </ul>
      )}

      {(s.requestId || s.traceId) && (
        <p
          style={{
            marginTop: "0.75rem",
            marginBottom: 0,
            fontSize: "0.75rem",
            color: "var(--c-fg-3)",
            fontFamily: "monospace",
          }}
        >
          Reference{s.requestId && <> · req {s.requestId}</>}
          {s.traceId && <> · trace {s.traceId}</>}
        </p>
      )}

      {s.stack && (
        <pre
          style={{
            marginTop: "0.75rem",
            padding: "0.5rem",
            background: "var(--c-bg-3)",
            border: "1px solid var(--c-border-2)",
            color: "var(--c-fg-2)",
            overflowX: "auto",
            fontSize: "0.75rem",
          }}
        >
          <code>{s.stack}</code>
        </pre>
      )}
    </div>
  );
}
