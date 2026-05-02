# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClutterStock is a home inventory management system — a full-stack web app for tracking items organized by location and room. The backend is ASP.NET Core 10 (Minimal APIs + EF Core + PostgreSQL) and the frontend is React 19 with React Router 7 (SSR enabled), TypeScript, and TailwindCSS 4.

## Build & Development Commands

### Backend (.NET)

```bash
dotnet build backend/ClutterStock.slnx
dotnet watch run --project backend/src/Api/Api.csproj   # dev server on :8081
dotnet test backend/ClutterStock.slnx
dotnet test backend/tests/Api.Tests/Api.Tests.csproj --filter "TestName"  # single test
dotnet run --project backend/src/Migrator/Migrator.csproj -- <connection-string>
```

### Frontend (Node)

```bash
cd frontend
npm run dev          # dev server on :5173
npm run build
npm run start        # production SSR server
npm test             # Vitest unit tests
npm test -- app/features/items.test.ts   # single test file
npm run test:e2e     # Playwright E2E tests
npm run lint
npm run lint:fix
npm run coverage:ci
npm run openapi-typescript  # regenerate types from backend OpenAPI (run after backend changes)
```

## Architecture

### Backend

The backend uses a **CQRS-like feature pattern** with Minimal APIs:

- `Domain/Features/{Feature}/{Operation}/` — each feature operation has a command/query record, a handler, and an endpoint class implementing `IEndpoint`
- Endpoints are **auto-discovered by a source generator** (`EndpointGenerator`) — no manual route registration needed; just implement `IEndpoint`
- `EntityRecordGenerator` source generator auto-generates entity records from entity definitions in the `Entities` project
- `Contracts/` — shared request/response DTOs published as a NuGet package; the frontend consumes the OpenAPI spec generated from these

**Key projects:**
- `Api/` — entry point, startup, middleware
- `Domain/` — business logic, feature handlers
- `Infrastructure/` — EF Core `ApplicationContext`, migrations, entity configurations
- `Entities/` — domain entity definitions
- `Migrator/` — standalone CLI for applying migrations

**Database:** PostgreSQL (via Npgsql/EF Core). Connection string configured via `ConnectionStrings:ClutterStock` in app settings or environment. Migrations live in `Infrastructure/Database/Migrations/`. Fluent API config in `Infrastructure/Database/Configurations/`.

### Frontend

Feature-based layout mirroring the backend domains (items, locations, rooms):

- `app/features/{feature}/` — route loaders/actions, form components, list components
- `app/api/` — OpenAPI-generated TypeScript types (`types.ts`) and HTTP client; **regenerate after backend API changes** with `npm run openapi-typescript`
- `app/routes/` — React Router route definitions; includes `auth.signin`, `auth.callback`, `auth.signout` for OIDC flow
- `app/lib/oidc.server.ts` — server-side OIDC/PKCE helpers (discovery, auth URL generation, token exchange, refresh)
- `app/lib/session.server.ts` — Redis-backed server-side session management (7-day TTL, `clutterstock_sid` cookie)
- `app/lib/redis.server.ts` — shared Redis client singleton (`REDIS_URL` env var)
- `app/lib/theme.ts` — `useTheme()` hook; themes: `system`, `tui`, `win98`, `cde`
- `app/otel/` — OpenTelemetry instrumentation (NodeSDK for SSR, web SDK for browser)

React Router SSR is enabled by default. Loaders/actions run server-side; browser bundle is hydrated on the client.

### Authentication

OIDC/PKCE flow against Authelia (`auth.wsh.no`). The SSR server handles the full OAuth dance server-side — no tokens ever reach the browser. Sessions are stored in Redis and identified by a `clutterstock_sid` HttpOnly cookie. The access token is attached to backend API calls in server-side loaders.

**Auth routes:** `GET /auth/signin` → redirects to Authelia → `GET /auth/callback` → sets session cookie → `GET /auth/signout` → clears session + Authelia end-session redirect.

### Contract Sync

The backend OpenAPI spec is the source of truth for the frontend's API types. After changing backend DTOs or endpoints, regenerate frontend types:

```bash
# Ensure backend dev server is running, then:
cd frontend && npm run openapi-typescript
```

## Testing

**Backend tests** run on **xUnit v3** with **Microsoft.Testing.Platform (MTP)** — coverage is collected via **`coverlet.MTP`** (no `coverlet.collector` / VSTest needed). Filter syntax is the MTP form, e.g. `dotnet test --project ... -- --filter-method "*ItemsApiTests*"` (note the `--` separator and `--filter-method` flag, not `--filter "FullyQualifiedName~..."`).

Integration tests use the `WebApplicationFactory` pattern with a real PostgreSQL **Testcontainer** (no in-memory provider). The factory in `tests/Api.Tests/Infrastructure/ClutterStockApiFactory.cs` starts a `postgres:16-alpine` container in `IAsyncLifetime.InitializeAsync` and injects the container's connection string via `builder.UseSetting("ConnectionStrings:ClutterStock", ...)` — `ConfigureAppConfiguration` is too late because `Program.cs` reads the connection string before `Build()`. Each test gets a clean slate via `ResetDatabaseAsync()` (TRUNCATE … RESTART IDENTITY CASCADE), not by re-running migrations. Docker must be available on the test host.

**Frontend unit tests** use Vitest with MSW for API mocking. Test setup is in `app/test/setup.ts`. Coverage uses V8 provider (Cobertura/LCOV output).

**E2E tests** use Playwright against the full running stack and follow the **Page Object Model** pattern — page classes live under `frontend/e2e/pages/` and are exposed to specs via the `home` fixture in `frontend/e2e/fixtures.ts`; specs use `await home.<thing>()` instead of raw locators. Authentication is handled by a setup fixture (`e2e/auth.setup.ts`) that logs in through Authelia with TOTP/2FA — requires `E2E_USERNAME`, `E2E_PASSWORD`, and `E2E_OTP_SECRET` env vars (see `frontend/.env.test.sample`). Auth state is cached in `playwright/.auth/`.

**Local E2E stack** comes up via `scripts/e2e-up.sh` which builds api/migrator/frontend container images locally (no GHCR push) and starts `docker-compose.e2e.yml`. Host ports are deliberately mapped to mimic the dev URLs already baked into the frontend image and hardcoded in tests: frontend `5173:3000`, api `5155:8081`. The script supports remote docker contexts (ssh:// or tcp:// with `--ssh-host`) by tunnelling the docker socket and the two app ports over a single SSH master. The `signout` Playwright project depends on the `chromium` project — sign-out destroys the shared Redis session keyed by `playwright/.auth/user.json`, so it must run last.

**E2E in CI** is split into two workflows:
- `pr-e2e.yml` — fast smoke on PRs and main pushes. Builds api/migrator/frontend container images via the reusable `dotnet-container.yml` / `docker-container.yml` workflows, scans with Grype (gateable per-PR via the `skip-grype` label), runs the suite against digest-pinned refs in compose, posts a jq-built `e2e-results` PR comment. The `push: branches: [main]` trigger is what keeps the `:latest` images updated (gitversion produces `latest;<MajorMinorPatch>` only on main).
- `nightly-e2e.yml` — `cron: '0 3 * * *'` + workflow_dispatch. Pulls the same `docker-compose.e2e.yml` stack but resolves images as `:latest` (last main merge), and adds the `allure-playwright` reporter output. Generates the Allure 3 report with cross-run history. Pushes two `FROM scratch` images to GHCR on `success() || failure()`: `allure-history:latest` (single `history.jsonl`, the trend's persistent state — never checked into git) and `allure-report:latest` (the rendered HTML). The daily catches Authelia drift, loose-tag upstream drift (`postgres:16-alpine`, `redis:7-alpine`, `ubuntu-latest`), and accumulates flake-rate signal. `api-docs-pages.yml` pulls `allure-report:latest` on release runs and embeds it under `/e2e-allure/` on the Pages site.

## Key Conventions

- **Nullable enabled** everywhere in C#; treat warnings as errors (`Directory.Build.props`)
- **EditorConfig** enforces style — run ReSharper cleanup or check `.editorconfig` before committing
- `IEndpoint` implementations are discovered automatically — do not register routes manually
- OpenAPI documentation is auto-generated from endpoint metadata and XML comments
- **Endpoint response types**: declare only endpoint-specific responses in the `Results<...>` typed signature (e.g. `Ok<T>`, `Created<T>`, `NotFound`, `NoContent`). Cross-cutting responses — `400` (validation), `401`, `403`, `500` — are advertised globally by `GlobalResponsesOperationFilter` (`backend/src/Api/Filters/GlobalResponsesOperationFilter.cs`); do not duplicate them per-endpoint
- **Validation**: enabled via `builder.Services.AddValidation()`. Put `System.ComponentModel.DataAnnotations` attributes on `Contracts/` request records using the `[property: ...]` target (e.g. `[property: Range(1, int.MaxValue)] int RoomId`) and on `[FromRoute]` id parameters. Don't write manual `if (request.X is invalid) return BadRequest(...)` checks in handlers — let the validation pipeline produce the `HttpValidationProblemDetails` response
- **ProblemDetails enrichment**: `requestId` (TraceIdentifier) and `traceId` (OTel activity id) are added to every problem-details response in `Program.cs`; lean on this for support/debugging instead of logging the correlation id separately
- Frontend env vars in `frontend/.env`: `VITE_API_URL`, `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `REDIS_URL`, `PUBLIC_ORIGIN` (optional, defaults to request origin)
- Backend listens on port **8081** (HTTP) by default in development
- Observability: OTLP HTTP exporter for traces/metrics/logs; service names `clutterstock-frontend-ssr` and `clutterstock-frontend-web`
- Multi-theme UI: themes are set via `data-theme` attribute on `<html>`; supported values are `tui`, `win98`, `cde`, `system`
