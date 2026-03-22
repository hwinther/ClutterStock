import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

let started = false;

/**
 * Node SDK reads standard OTEL_* env vars at process runtime (not Vite `import.meta`).
 * Set e.g. OTEL_EXPORTER_OTLP_ENDPOINT or OTEL_EXPORTER_OTLP_TRACES_ENDPOINT in K8s/Docker.
 * Browser traces use URLs injected from the root loader (see root.tsx); those may differ
 * from the in-cluster collector URL the Node exporter uses.
 */
export function startNodeOpenTelemetry(): void {
  if (started) return;
  if (process.env.OTEL_SDK_DISABLED === "true") return;

  started = true;

  const sdk = new NodeSDK({
    serviceName:
      process.env.OTEL_SERVICE_NAME ?? "clutterstock-frontend-ssr",
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
      }),
    ],
    logRecordProcessors: [
      new BatchLogRecordProcessor(new OTLPLogExporter()),
    ],
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();
}
