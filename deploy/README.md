# deploy/

Workload manifests for ClutterStock: the API (with the migrator as its initContainer), the SSR
frontend, and the Ingress. On every release, the `manifests` job in
`.github/workflows/container.yml` runs the `manifests` action from hwinther/reusable-workflows,
which:

1. renders this directory, with the api, migrator and frontend images pinned to `tag@digest`;
2. validates the output with kubeconform;
3. pushes it as an OCI artifact to `ghcr.io/hwinther/clutterstock/manifests:<version>`;
4. signs it with cosign (keyless).

On pull requests, `manifest-diff.yml` posts the rendered diff against the base branch as a PR
comment. A PR labelled `deploy-feature` also gets a preview environment: the `manifests` job in
`pr-e2e.yml` renders this directory the same way with the PR's images and pushes it as
`manifests:pr-<N>`, signed by `pr-e2e.yml`, which only the cluster's preview tree accepts. Don't
commit rendered output.

The cluster repo (hwinther/proxmox) consumes the artifact through a Flux `OCIRepository` and
`Kustomization` per environment. It provides everything that isn't in here:

- the namespace (via `targetNamespace`) and network policies;
- the PostgreSQL database and role, and the Secrets below;
- the variable values below (via `postBuild.substitute`).

## Migrations

The migrator runs `MigrateAsync()` as an initContainer of the API pod, so a new release migrates
before its API starts, and a restart or an extra replica re-runs a no-op. There are no
down-migrations, and during a rolling update the previous release's pods still serve on the new
schema. So each release's migrations must be backward compatible with the previous release
(expand/contract): add columns and tables first, drop or rename them a release later.

Name a migration that drops or renames something (the contract step) with `Contract` after the
timestamp, e.g. `dotnet ef migrations add ContractDropLegacyColumns`. A rollback across one would
run old code on a schema it can't use, so `promote.yml` refuses it unless forced.

## Promotion

Test runs the newest release by itself. Production pins an exact release in hwinther/proxmox and
accepts only artifacts co-signed by `promote.yml`. To promote or roll back, run **Promote to
production** (Actions, from `main`) with the version:

1. It checks the artifact carries the release signature. A promotion must be the newest release
   (what test runs); a rollback must be older than production and not cross a contract migration
   (`force` overrides that).
2. It waits for approval on the `production` environment.
3. It co-signs the artifact digest and opens (or updates) the tag-bump PR in hwinther/proxmox.
   Merging that PR deploys it.

Running it with the version production already pins only re-signs it.

## Contract

### Variables

CI fails if the rendered output contains a variable without a default that isn't listed here.
Flux would otherwise substitute an empty string. Only substitute string values: kustomize drops
quotes, so a number or boolean would come out as the wrong YAML type.

| Variable | Default | Used for |
|---|---|---|
| `APP_HOST` | (required) | Ingress host, `PUBLIC_ORIGIN` (OIDC redirect URIs) and the browser OTLP endpoint, e.g. `clutterstock.wsh.no` |
| `OIDC_AUTHORITY` | (required) | OIDC issuer for the frontend login and the API's JWT validation, e.g. `https://auth.wsh.no` |
| `OIDC_CLIENT_ID` | `clutterstock` | Frontend OIDC client |
| `OIDC_AUDIENCE` | `clutterstock-api` | API JWT audience |
| `PG_HOST` | (required) | PostgreSQL read-write service |
| `PG_DB` | `clutterstock` | Database name |
| `PG_USER` | (required) | Database role (owns the schema; the migrator uses it too) |
| `PG_SECRET` | (required) | Name of the Secret holding that role's `password` |
| `RABBITMQ_HOST` | (required) | RabbitMQ broker |
| `RABBITMQ_VHOST` | (required) | RabbitMQ virtual host |
| `RABBITMQ_SECRET` | (required) | Name of the Secret with the RabbitMQ `username` and `password` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | (required) | API OTLP gRPC collector endpoint |
| `APP_ENVIRONMENT` | `production` | `deployment.environment` resource attribute |
| `HOMEPAGE_NAME` | `Clutterstock` | gethomepage.dev tile name |

### Secrets

In the target namespace:

- `${PG_SECRET}`: key `password`, for `PG_USER`.
- `${RABBITMQ_SECRET}`: keys `username`, `password`.
- `clutterstock-valkey`: key `redis-url`, the Valkey/Redis connection URL for frontend sessions and
  the API cache.

### Resource names

`Deployment/clutterstock-api`, `Service/clutterstock-api`, `Deployment/clutterstock-frontend`,
`Service/clutterstock-frontend`, `Ingress/clutterstock`. Flux prunes anything that disappears from
the artifact, so rename deliberately.

## Render locally

`kubectl kustomize deploy` shows the manifests. For the contract check and kubeconform, as CI runs
them, use the action's script from a hwinther/reusable-workflows checkout (needs kubectl and
kubeconform on `PATH`):

```bash
RENDERS='clutterstock.yaml=deploy' \
  bash ../reusable-workflows/.github/actions/manifests/scripts/render-all.sh . /tmp/manifests /tmp/renders.txt validate
```
