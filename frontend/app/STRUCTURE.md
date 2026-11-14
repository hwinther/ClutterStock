# App structure

- **api/** – Generated OpenAPI types (`types.ts`, by `npm run openapi-typescript`; kept out of Prettier and ESLint) and the shared API client (`client.ts`). Uses `constants/api` for the base URL.
- **components/** – Shared UI: the site header and footer, the per-theme chrome (TUI widgets, Win98 tree and bars, CDE bars), the terminal, the help overlay and the error boundary (`ProblemBoundary`).
- **constants/** – Centralized config: `api.ts` (API base URL).
- **features/** – The home page's panels, per domain:
  - **items/** – View and edit panels, and the TUI table, detail, edit form and room picker.
  - **rooms/** – The new-room panel.
  - **locations/** – The new-location panel.
- **lib/** – Server modules (`*.server.ts`: OIDC, session, Redis, toasts, CSP reports, security headers) and shared helpers (theme, time, version, toasts).
- **routes/** – React Router route modules: the home page (`home.tsx`, all themes), auth, SSE, health, debug and CSP-report endpoints.
- **test/** – Test setup, MSW handlers and helpers (an in-memory Redis, a router with a recording action).

Unit tests (Vitest) cover components, features, lib and the API client; the e2e suite covers the routes.
