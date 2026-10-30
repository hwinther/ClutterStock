import { startWebTelemetry } from "@wshno/otel/web";

import { readPublicRuntimeConfigFromWindow } from "~/public-runtime-config";

export function startBrowserOpenTelemetry(): void {
  const fromDocument = readPublicRuntimeConfigFromWindow();
  startWebTelemetry({
    url:
      fromDocument?.otelTracesEndpoint?.trim() ||
      import.meta.env.VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
    serviceName:
      fromDocument?.otelServiceName?.trim() ||
      import.meta.env.VITE_OTEL_SERVICE_NAME ||
      "clutterstock-frontend-web",
    propagateTraceHeaderCorsUrls: /.*/,
  });
}
