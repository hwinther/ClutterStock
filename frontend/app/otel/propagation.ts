import type { TextMapGetter } from "@opentelemetry/api";

export const headersTextMapGetter: TextMapGetter<Headers> = {
  keys(carrier) {
    return [...carrier.keys()];
  },
  get(carrier, key) {
    const value = carrier.get(key);
    return value === null ? undefined : value;
  },
};
