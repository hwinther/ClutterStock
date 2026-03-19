import {
  context,
  propagation,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

import { headersTextMapGetter } from "./propagation";

export function withSsrRequestSpan<T>(
  request: Request,
  fn: () => Promise<T>,
): Promise<T> {
  const parentCtx = propagation.extract(
    context.active(),
    request.headers,
    headersTextMapGetter,
  );

  return context.with(parentCtx, async () => {
    const tracer = trace.getTracer("clutterstock.react-router");
    const span = tracer.startSpan("ssr.document", {
      attributes: {
        "http.request.method": request.method,
        "url.full": request.url,
      },
    });
    const spanCtx = trace.setSpan(context.active(), span);

    try {
      const result = await context.with(spanCtx, fn);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      });
      throw err;
    } finally {
      span.end();
    }
  });
}
