# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## OpenTelemetry (SSR + browser)

The app exports **traces, metrics, and logs** from the **Node SSR** process via `NodeSDK` + OTLP HTTP (see `app/otel/server.ts`), and **traces** from the **browser** when you set a public traces URL (see `app/otel/browser.ts`).

### Server (SSR / `react-router-serve`)

Uses standard `OTEL_*` environment variables (for example `OTEL_EXPORTER_OTLP_ENDPOINT` or signal-specific endpoints, `OTEL_SERVICE_NAME`, `OTEL_SDK_DISABLED=true` to turn everything off). Default service name if unset: `clutterstock-frontend-ssr`.

Incoming `traceparent` / `tracestate` on the document request are extracted so the `ssr.document` span can join an upstream trace when your gateway or collector injects context.

### Browser

Vite only exposes variables prefixed with `VITE_`. Browser export is initialized only when this is set:

- `VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` — full OTLP/HTTP traces URL (for example `http://localhost:4318/v1/traces` or your collector/ingress path).
- `VITE_OTEL_SERVICE_NAME` — optional; default `clutterstock-frontend-web`.

Fetch instrumentation propagates W3C trace context to backends that accept CORS **`traceparent`** and **`tracestate`** on your API (`VITE_API_URL`). The backend must allow those request headers and expose `Access-Control-Allow-Origin` for the frontend origin.

### Collector / ingress

Expose OTLP HTTP (often port **4318**) to:

- the **Node** SSR app (server → collector),
- the **browser** (browser → collector; requires **CORS** allowing the site origin, `POST`, and typically headers like `content-type`).

---

Built with ❤️ using React Router.
