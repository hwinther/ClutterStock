# ClutterStock

[![Release](https://img.shields.io/github/v/release/hwinther/ClutterStock)](https://github.com/hwinther/ClutterStock/releases)
[![License](https://img.shields.io/github/license/hwinther/ClutterStock)](https://github.com/hwinther/ClutterStock/blob/main/LICENSE)

Because “somewhere in the garage” isn’t a location. Home inventory for your actual clutter—electronics, parts, homelab and all.

## Status

| | |
|---|---|
| **Build and release** | [![CI and E2E on main](https://github.com/hwinther/ClutterStock/actions/workflows/pr-e2e.yml/badge.svg?branch=main&event=push)](https://github.com/hwinther/ClutterStock/actions/workflows/pr-e2e.yml) [![Publish containers and manifests to GHCR](https://github.com/hwinther/ClutterStock/actions/workflows/container.yml/badge.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/container.yml) [![Create tag and release](https://github.com/hwinther/ClutterStock/actions/workflows/tag-and-release.yml/badge.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/tag-and-release.yml) [![API Docs (GitHub Pages)](https://github.com/hwinther/ClutterStock/actions/workflows/api-docs-pages.yml/badge.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/api-docs-pages.yml) |
| **Tests** | [![Unit tests](https://hwinther.github.io/ClutterStock/badges/tests-unit.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/pr-e2e.yml?query=branch%3Amain+event%3Apush) [![E2E tests](https://hwinther.github.io/ClutterStock/badges/tests-e2e.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/pr-e2e.yml?query=branch%3Amain+event%3Apush) [![Build, lint and typecheck warnings](https://hwinther.github.io/ClutterStock/badges/warnings.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/pr-e2e.yml?query=branch%3Amain+event%3Apush) |
| **Test coverage** | [![Backend coverage](https://hwinther.github.io/ClutterStock/badges/coverage-backend.svg)](https://hwinther.github.io/ClutterStock/coverage-dotnet/) [![Backend branch coverage](https://hwinther.github.io/ClutterStock/badges/coverage-backend-branches.svg)](https://hwinther.github.io/ClutterStock/coverage-dotnet/) [![Frontend coverage](https://hwinther.github.io/ClutterStock/badges/coverage-frontend.svg)](https://hwinther.github.io/ClutterStock/coverage-node/) [![Frontend branch coverage](https://hwinther.github.io/ClutterStock/badges/coverage-frontend-branches.svg)](https://hwinther.github.io/ClutterStock/coverage-node/) [![Frontend unit+e2e coverage](https://hwinther.github.io/ClutterStock/badges/coverage-combined.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/pr-e2e.yml?query=branch%3Amain+event%3Apush) [![E2E coverage (nightly)](https://hwinther.github.io/ClutterStock/badges/coverage-e2e.svg)](https://hwinther.github.io/ClutterStock/coverage-e2e/) |
| **Nightly** | [![Nightly E2E (Allure)](https://github.com/hwinther/ClutterStock/actions/workflows/nightly-e2e.yml/badge.svg?branch=main)](https://github.com/hwinther/ClutterStock/actions/workflows/nightly-e2e.yml) [![Nightly E2E (cached)](https://hwinther.github.io/ClutterStock/badges/nightly-e2e.svg)](https://hwinther.github.io/ClutterStock/e2e-allure/) [![Nightly preview E2E](https://github.com/hwinther/ClutterStock/actions/workflows/nightly-preview.yml/badge.svg?branch=main)](https://github.com/hwinther/ClutterStock/actions/workflows/nightly-preview.yml) [![Lighthouse performance (nightly)](https://hwinther.github.io/ClutterStock/badges/lighthouse-performance.svg)](https://hwinther.github.io/ClutterStock/e2e-report/lighthouse-home.html) [![Lighthouse accessibility (nightly)](https://hwinther.github.io/ClutterStock/badges/lighthouse-accessibility.svg)](https://hwinther.github.io/ClutterStock/e2e-report/lighthouse-home.html) [![Lighthouse best practices (nightly)](https://hwinther.github.io/ClutterStock/badges/lighthouse-best-practices.svg)](https://hwinther.github.io/ClutterStock/e2e-report/lighthouse-home.html) [![Lighthouse SEO (nightly)](https://hwinther.github.io/ClutterStock/badges/lighthouse-seo.svg)](https://hwinther.github.io/ClutterStock/e2e-report/lighthouse-home.html) |
| **Security** | [![Image vulnerabilities (Grype)](https://hwinther.github.io/ClutterStock/badges/vulnerabilities.svg)](https://github.com/hwinther/ClutterStock/actions/workflows/pr-e2e.yml?query=branch%3Amain+event%3Apush) [![OWASP ZAP Scan](https://github.com/hwinther/ClutterStock/actions/workflows/zap-scan.yml/badge.svg?branch=main)](https://github.com/hwinther/ClutterStock/actions/workflows/zap-scan.yml) [![ZAP findings](https://hwinther.github.io/ClutterStock/badges/security-zap.svg)](https://hwinther.github.io/ClutterStock/security/) [![Poutine - GitHub Actions SAST](https://github.com/hwinther/ClutterStock/actions/workflows/poutine.yml/badge.svg?branch=main)](https://github.com/hwinther/ClutterStock/actions/workflows/poutine.yml) [![zizmor - GitHub Actions SAST](https://github.com/hwinther/ClutterStock/actions/workflows/zizmor.yml/badge.svg?branch=main)](https://github.com/hwinther/ClutterStock/actions/workflows/zizmor.yml) |

## Documentation and reports

This README is also the home page of the [GitHub Pages site](https://hwinther.github.io/ClutterStock/), which publishes:

| What | Where |
|---|---|
| API reference (OpenAPI / ReDoc) | [`/api/`](https://hwinther.github.io/ClutterStock/api/) |
| Database schema (SchemaSpy) | [`/database/`](https://hwinther.github.io/ClutterStock/database/) |
| Project docs (Markdown) | [`/project-docs/`](https://hwinther.github.io/ClutterStock/project-docs/) |
| Unit test coverage | backend [`/coverage-dotnet/`](https://hwinther.github.io/ClutterStock/coverage-dotnet/), frontend [`/coverage-node/`](https://hwinther.github.io/ClutterStock/coverage-node/) |
| E2E test results (Playwright, nightly) | [Allure report `/e2e-allure/`](https://hwinther.github.io/ClutterStock/e2e-allure/), [monocart dashboard `/e2e-report/`](https://hwinther.github.io/ClutterStock/e2e-report/) with the latest [Lighthouse audit](https://hwinther.github.io/ClutterStock/e2e-report/lighthouse-home.html) |
| E2E browser coverage (V8) | [`/coverage-e2e/`](https://hwinther.github.io/ClutterStock/coverage-e2e/) |
| Security scan (OWASP ZAP, API) | [`/security/`](https://hwinther.github.io/ClutterStock/security/) |
| Status badges | [`/badges/`](https://hwinther.github.io/ClutterStock/badges/), also shipped as `ghcr.io/hwinther/clutterstock/badges-e2e:latest` for air-gapped consumers (rendered by the [reusable `badges` action](https://github.com/hwinther/reusable-workflows/blob/main/docs/badges.md)) |

## Repository layout

| Path | Contents |
|---|---|
| [`backend/`](https://github.com/hwinther/ClutterStock/tree/main/backend) | ASP.NET Core API, domain, EF Core (Postgres) and tests |
| [`frontend/`](https://github.com/hwinther/ClutterStock/tree/main/frontend) | React Router SSR app |
| [`e2e/`](https://github.com/hwinther/ClutterStock/tree/main/e2e) | Playwright end-to-end and load tests |
| [`deploy/`](https://github.com/hwinther/ClutterStock/tree/main/deploy) | Kubernetes manifests (see its README for the substitutions) |
| [`scripts/`](https://github.com/hwinther/ClutterStock/tree/main/scripts) | Local e2e stack (`e2e-up.sh`) and the Dockerfiles of the report images |
