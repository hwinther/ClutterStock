import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import { SiteFooter } from "~/components/site-footer";
import { SiteHeader } from "~/components/site-header";
import type { PublicRuntimeConfig } from "~/public-runtime-config";
import type { SessionUser } from "~/lib/session.server";
import "./app.css";

export async function loader({
  request,
}: Route.LoaderArgs): Promise<{ publicRuntime: PublicRuntimeConfig; user: SessionUser | null }> {
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
    };
  }

  const { getSession } = await import("~/lib/session.server");
  let user: SessionUser | null = null;
  try {
    const sess = await getSession(request);
    user = sess?.data.user ?? null;
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
        <SiteHeader />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
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
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
