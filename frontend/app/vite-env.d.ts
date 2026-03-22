/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Set at image build via Docker build-args (CI). */
  readonly VITE_APP_VERSION?: string;
  readonly VITE_GIT_SHA?: string;
  /** Build-time fallback; at runtime in Docker/K8s prefer PUBLIC_* via root loader + process.env on SSR. */
  readonly VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?: string;
  readonly VITE_OTEL_SERVICE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
