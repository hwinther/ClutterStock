import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { ProblemBoundary } from "~/components/problem-boundary";
import { SiteFooter } from "~/components/site-footer";
import { SiteHeader } from "~/components/site-header";
import { Toaster, ToastProvider, type ToastInput } from "~/lib/toasts";
import type { PublicRuntimeConfig } from "~/public-runtime-config";
import type { SessionUser } from "~/lib/session.server";
import "./app.css";

interface RootLoaderData {
  publicRuntime: PublicRuntimeConfig;
  user: SessionUser | null;
  flashes: readonly ToastInput[];
}

export async function loader({ request }: Route.LoaderArgs): Promise<RootLoaderData> {
  if (globalThis.window !== undefined) {
    const w = globalThis.window as Window & {
      __CLUTTERSTOCK_PUBLIC__?: PublicRuntimeConfig;
    };
    return {
      publicRuntime: w.__CLUTTERSTOCK_PUBLIC__ ?? {
        otelTracesEndpoint: "",
        otelServiceName: "",
      },
      user: null,
      flashes: [],
    };
  }

  const { getSession } = await import("~/lib/session.server");
  const { drainFlashes } = await import("~/lib/toasts.server");
  let user: SessionUser | null = null;
  let flashes: readonly ToastInput[] = [];
  try {
    const sess = await getSession(request);
    user = sess?.data.user ?? null;
    flashes = await drainFlashes(request);
  } catch (err) {
    // Redis unavailable — serve page unauthenticated rather than crashing
    console.error("[root] session lookup failed:", err);
  }

  return {
    publicRuntime: {
      otelTracesEndpoint:
        process.env.PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim() ||
        process.env.VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim() ||
        "",
      otelServiceName:
        process.env.PUBLIC_OTEL_SERVICE_NAME?.trim() ||
        process.env.VITE_OTEL_SERVICE_NAME?.trim() ||
        "",
    },
    user,
    flashes,
  };
}

function PublicRuntimeConfigScript() {
  const data = useRouteLoaderData("root");
  const cfg = data?.publicRuntime;
  if (!cfg) return null;
  const json = JSON.stringify(cfg);
  return (
    <script
      // Runs before module scripts; hydrates browser OTEL + other public runtime config.
      dangerouslySetInnerHTML={{
        __html: `window.__CLUTTERSTOCK_PUBLIC__=${json};`,
      }}
    />
  );
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const data = useRouteLoaderData("root") as RootLoaderData | undefined;
  const initialFlashes = data?.flashes ?? [];

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Set theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){try{var t=localStorage.getItem('cs-theme');if(t&&['tui','win98','cde'].includes(t))document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
        }} />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen flex flex-col">
        <ToastProvider initial={initialFlashes}>
          <SiteHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <SiteFooter />
          <Toaster />
        </ToastProvider>
        <PublicRuntimeConfigScript />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <ProblemBoundary error={error} scope="page" />
    </main>
  );
}
