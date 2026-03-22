import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";

import { readPublicRuntimeConfigFromWindow } from "~/public-runtime-config";

export function startBrowserOpenTelemetry(): void {
  const fromDocument = readPublicRuntimeConfigFromWindow();
  const url =
    fromDocument?.otelTracesEndpoint?.trim() ||
    import.meta.env.VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  if (!url) return;

  const serviceName =
    fromDocument?.otelServiceName?.trim() ||
    import.meta.env.VITE_OTEL_SERVICE_NAME ||
    "clutterstock-frontend-web";

  const exporter = new OTLPTraceExporter({ url });

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  provider.register({
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      getWebAutoInstrumentations({
        "@opentelemetry/instrumentation-fetch": {
          propagateTraceHeaderCorsUrls: /.*/,
          ignoreUrls: [url, /\/v1\/traces(\?|$)/],
          clearTimingResources: true,
        },
      }),
    ],
  });
}
