import { withRequestSpan } from "@wshno/otel/ssr";

export function withSsrRequestSpan<T>(
  request: Request,
  fn: () => Promise<T>,
): Promise<T> {
  return withRequestSpan(request, fn, {
    tracerName: "clutterstock.react-router",
  });
}
