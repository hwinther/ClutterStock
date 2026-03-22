import { useMemo } from "react";

import type { Route } from "./+types/debug.config";
import { getApiBase } from "~/constants/api";
import {
  isDebugConfigAllowed,
  pickDebugServerEnv,
  pickImportMetaEnvForDebug,
} from "~/lib/debug-config";
import { readPublicRuntimeConfigFromWindow } from "~/public-runtime-config";

export async function loader(_args: Route.LoaderArgs) {
  if (!isDebugConfigAllowed()) {
    throw new Response(null, { status: 404 });
  }

  return {
    serverEnv: pickDebugServerEnv(),
    apiBaseResolvedOnServer: getApiBase(),
  };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Debug config | ClutterStock" }];
}

function EnvTable({ rows }: { readonly rows: Record<string, string> }) {
  const entries = useMemo(
    () =>
      Object.entries(rows).sort(([a], [b]) => a.localeCompare(b, "en")),
    [rows],
  );
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-neutral-300 dark:border-neutral-600 text-left">
          <th className="py-2 pr-4 font-medium text-neutral-600 dark:text-neutral-400">
            Name
          </th>
          <th className="py-2 font-medium text-neutral-600 dark:text-neutral-400">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, value]) => (
          <tr
            key={key}
            className="border-b border-neutral-200 dark:border-neutral-700 align-top"
          >
            <td className="py-2 pr-4 font-mono text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
              {key}
            </td>
            <td className="py-2 font-mono text-neutral-700 dark:text-neutral-300 break-all">
              {value === "" ? (
                <span className="text-neutral-400 dark:text-neutral-500 italic">
                  (unset)
                </span>
              ) : (
                value
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DebugConfigRoute({ loaderData }: Route.ComponentProps) {
  const importMetaEnv = pickImportMetaEnvForDebug();
  const windowPublic = readPublicRuntimeConfigFromWindow();
  const apiBaseClient = getApiBase();

  return (
    <main className="pt-16 p-4 container mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Debug configuration</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400 text-sm">
          Gated by{" "}
          <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
            import.meta.env.DEV
          </code>{" "}
          or{" "}
          <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 rounded">
            ENABLE_DEBUG_CONFIG=true
          </code>
          {". Only non-secret keys are listed; do not expose this URL publicly in production."}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">API base (effective)</h2>
        <dl className="grid gap-2 text-sm font-mono">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="text-neutral-500 shrink-0">SSR / loader</dt>
            <dd className="break-all">{loaderData.apiBaseResolvedOnServer || "(empty)"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="text-neutral-500 shrink-0">This browser</dt>
            <dd className="break-all">{apiBaseClient || "(empty)"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Public runtime (window)</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          From root loader → <code>window.__CLUTTERSTOCK_PUBLIC__</code> (browser OTEL, etc.).
        </p>
        <EnvTable
          rows={{
            otelTracesEndpoint: windowPublic?.otelTracesEndpoint ?? "",
            otelServiceName: windowPublic?.otelServiceName ?? "",
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Server env (allowlisted)</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Snapshot from Node when the loader ran. OTEL SDK also reads other standard{" "}
          <code className="text-xs">OTEL_*</code> variables not listed here.
        </p>
        <EnvTable rows={loaderData.serverEnv} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">import.meta.env (client bundle)</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Vite-inlined at build time; useful for local and image build diagnosis.
        </p>
        <EnvTable rows={importMetaEnv} />
      </section>
    </main>
  );
}
