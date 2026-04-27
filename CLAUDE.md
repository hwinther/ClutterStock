# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ClutterStock is a home inventory management system — a full-stack web app for tracking items organized by location and room. The backend is ASP.NET Core 10 (Minimal APIs + EF Core + SQLite) and the frontend is React 19 with React Router 7 (SSR enabled), TypeScript, and TailwindCSS 4.

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

**Database:** SQLite (dev: `clutterstock.db`). Migrations live in `Infrastructure/Database/Migrations/`. Fluent API config in `Infrastructure/Database/Configurations/`.

### Frontend

Feature-based layout mirroring the backend domains (items, locations, rooms):

- `app/features/{feature}/` — route loaders/actions, form components, list components
- `app/api/` — OpenAPI-generated TypeScript types (`types.ts`) and HTTP client; **regenerate after backend API changes** with `npm run openapi-typescript`
- `app/routes/` — React Router route definitions
- `app/otel/` — OpenTelemetry instrumentation (NodeSDK for SSR, web SDK for browser)

React Router SSR is enabled by default. Loaders/actions run server-side; browser bundle is hydrated on the client.

### Contract Sync

The backend OpenAPI spec is the source of truth for the frontend's API types. After changing backend DTOs or endpoints, regenerate frontend types:

```bash
# Ensure backend dev server is running, then:
cd frontend && npm run openapi-typescript
```

## Testing

**Backend integration tests** use `WebApplicationFactory` pattern — they spin up the full API with an in-memory/test SQLite database. Test class names and namespaces determine the `--filter` value.

**Frontend unit tests** use Vitest with MSW for API mocking. Test setup is in `app/test/setup.ts`. Coverage uses V8 provider (Cobertura/LCOV output).

**E2E tests** use Playwright against the full running stack.

## Key Conventions

- **Nullable enabled** everywhere in C#; treat warnings as errors (`Directory.Build.props`)
- **EditorConfig** enforces style — run ReSharper cleanup or check `.editorconfig` before committing
- `IEndpoint` implementations are discovered automatically — do not register routes manually
- OpenAPI documentation is auto-generated from endpoint metadata and XML comments
- Frontend API URL configured via `frontend/.env` (`VITE_API_URL=http://localhost:5155`)
- Backend listens on port **8081** (HTTP) by default in development
- Observability: OTLP HTTP exporter for traces/metrics/logs; service names `clutterstock-frontend-ssr` and `clutterstock-frontend-web`
