export type PublicRuntimeConfig = {
  otelTracesEndpoint: string;
  otelServiceName: string;
};

declare global {
  interface Window {
    __CLUTTERSTOCK_PUBLIC__?: PublicRuntimeConfig;
  }
}

export function readPublicRuntimeConfigFromWindow():
  | PublicRuntimeConfig
  | undefined {
  return globalThis.window?.__CLUTTERSTOCK_PUBLIC__;
}
