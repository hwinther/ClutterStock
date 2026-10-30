import { startNodeTelemetry } from "@wshno/otel/node";

/**
 * Node SDK reads standard OTEL_* env vars at process runtime (not Vite `import.meta`).
 * Set e.g. OTEL_EXPORTER_OTLP_ENDPOINT or OTEL_EXPORTER_OTLP_TRACES_ENDPOINT in K8s/Docker.
 * Browser traces use URLs injected from the root loader (see root.tsx); those may differ
 * from the in-cluster collector URL the Node exporter uses.
 */
export function startNodeOpenTelemetry(): void {
  startNodeTelemetry({ serviceName: "clutterstock-frontend-ssr" });
}
