/** Keys safe to display (no secrets); values still appear in HTML—keep the route gated. */
const SERVER_DEBUG_ENV_KEYS = [
  "ENABLE_DEBUG_CONFIG",
  "NODE_ENV",
  "SERVER_API_URL",
  "API_URL",
  "VITE_API_URL",
  "PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
  "PUBLIC_OTEL_SERVICE_NAME",
  "VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
  "VITE_OTEL_SERVICE_NAME",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
  "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT",
  "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT",
  "OTEL_EXPORTER_OTLP_PROTOCOL",
  "OTEL_SERVICE_NAME",
  "OTEL_SDK_DISABLED",
  "OTEL_RESOURCE_ATTRIBUTES",
] as const;

export function isDebugConfigAllowed(): boolean {
  if (import.meta.env.DEV) return true;
  return process.env.ENABLE_DEBUG_CONFIG === "true";
}

export function pickDebugServerEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of SERVER_DEBUG_ENV_KEYS) {
    out[key] = process.env[key] ?? "";
  }
  return out;
}

function stringifyEnvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

export function pickImportMetaEnvForDebug(): Record<string, string> {
  const env = import.meta.env as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of Object.keys(env).sort((a, b) => a.localeCompare(b, "en"))) {
    out[key] = stringifyEnvValue(env[key]);
  }
  return out;
}
