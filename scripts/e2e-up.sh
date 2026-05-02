#!/usr/bin/env bash
# Build api/migrator/frontend container images locally and bring up the
# docker-compose.e2e.yml stack — mirrors .github/workflows/pr-e2e.yml but
# without pushing to a registry. Images live in the local docker daemon,
# tagged :local, and are reused on subsequent runs (docker layer cache +
# dotnet incremental build).
#
# Usage:
#   scripts/e2e-up.sh              # build (cached) + start stack
#   scripts/e2e-up.sh --no-build   # skip image builds, reuse existing :local tags
#   scripts/e2e-up.sh --down       # tear down the stack and exit

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

API_TAG="clutterstock/api:local"
MIGRATOR_TAG="clutterstock/migrator:local"
FRONTEND_TAG="clutterstock/frontend:local"

build=true
down=false
for arg in "$@"; do
  case "$arg" in
    --no-build) build=false ;;
    --down)     down=true ;;
    -h|--help)  sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

if [[ "$down" == "true" ]]; then
  docker compose -f docker-compose.e2e.yml down -v
  exit 0
fi

if [[ "$build" == "true" ]]; then
  echo "==> Building API container ($API_TAG)"
  dotnet publish backend/src/Api/Api.csproj \
    -c Release -t:PublishContainer -p:ContainerImageTag=local

  echo "==> Building Migrator container ($MIGRATOR_TAG)"
  dotnet publish backend/src/Migrator/Migrator.csproj \
    -c Release -t:PublishContainer -p:ContainerImageTag=local

  echo "==> Building Frontend container ($FRONTEND_TAG)"
  docker build -t "$FRONTEND_TAG" frontend/
fi

for img in "$API_TAG" "$MIGRATOR_TAG" "$FRONTEND_TAG"; do
  docker image inspect "$img" >/dev/null 2>&1 \
    || { echo "image $img not found — re-run without --no-build" >&2; exit 1; }
done

export API_IMAGE="$API_TAG"
export MIGRATOR_IMAGE="$MIGRATOR_TAG"
export FRONTEND_IMAGE="$FRONTEND_TAG"

echo "==> Bringing up stack"
docker compose -f docker-compose.e2e.yml up -d --wait --wait-timeout 180

cat <<EOF

Stack is up:
  - frontend: http://localhost:5173
  - api:      http://localhost:5155

Run E2E tests with:
  cd frontend && npx playwright test

Tear down with:
  scripts/e2e-up.sh --down
EOF
