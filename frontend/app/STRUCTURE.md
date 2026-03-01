# App structure (aligned with frontend guide)

- **api/** – Generated OpenAPI types (`types.ts`) and shared API client (`client.ts`). Uses `constants/api` for base URL.
- **assets/** – (Optional) Static assets; currently logos live in `welcome/`.
- **components/** – Shared UI used across features (e.g. `Breadcrumb`).
- **constants/** – Centralized config: `api.ts` (API base URL), `routes.ts` (path builders). Use for env-based or route values.
- **features/** – Feature-based modules (domain-style, familiar from backend):
  - **locations/** – Locations layout, list, form; exports for routes and layouts.
  - **rooms/** – Rooms list and form.
  - **items/** – Items list and form.
- **layouts/** – Layout wrappers (e.g. locations section layout re-exported from features).
- **routes/** – React Router route modules (loaders, actions, thin wrappers that use features and api).
- **types/** – (Optional) App-level types; API types stay in `api/types.ts` (generated).
- **utils/** – (Optional) Shared utility functions.
- **hooks/** – (Optional) Shared React hooks.

Routes and redirects use `~/constants/routes` instead of hardcoded URLs.
