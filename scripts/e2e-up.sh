#!/usr/bin/env bash
# Build api/migrator/frontend container images locally and bring up the
# docker-compose.e2e.yml stack — mirrors .github/workflows/pr-e2e.yml but
# without pushing to a registry. Images live in the docker daemon selected
# by the current docker context, tagged :local, and are reused on
# subsequent runs (docker layer cache + dotnet incremental build).
#
# Remote docker contexts are supported via SSH:
#   - ssh:// context: an SSH master is started forwarding the docker socket
#     locally (so dotnet publish / docker build / compose all target the
#     remote daemon transparently) plus the app ports 5173 and 5155 so the
#     stack stays reachable at http://localhost:5173 from your browser.
#   - tcp:// (or other) remote context: pass --ssh-host user@host[:port]
#     to forward the app ports. The docker context's own DOCKER_HOST is
#     used for daemon access.
#
# Usage:
#   scripts/e2e-up.sh                              # build (cached) + start stack
#   scripts/e2e-up.sh --no-build                   # skip builds, reuse existing :local tags
#   scripts/e2e-up.sh --down                       # tear down stack and SSH tunnel
#   scripts/e2e-up.sh --ssh-host user@host[:port]  # explicit forward host (required for tcp:// contexts)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

API_TAG="clutterstock/api:local"
MIGRATOR_TAG="clutterstock/migrator:local"
FRONTEND_TAG="clutterstock/frontend:local"

FRONTEND_PORT=5173
API_PORT=5155
DOCKER_SOCK_LOCAL_PORT=23750
SSH_CTRL="${TMPDIR:-/tmp}/clutterstock-e2e-ssh.sock"

build=true
down=false
ssh_host_override=""

while (( $# > 0 )); do
  case "$1" in
    --no-build) build=false; shift ;;
    --down)     down=true; shift ;;
    --ssh-host) ssh_host_override="${2:-}"; shift 2 ;;
    --ssh-host=*) ssh_host_override="${1#--ssh-host=}"; shift ;;
    -h|--help)  sed -n '2,23p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# --- Detect docker context endpoint ---------------------------------------

ctx_endpoint="${DOCKER_HOST:-}"
if [[ -z "$ctx_endpoint" ]]; then
  ctx_endpoint=$(docker context inspect --format '{{.Endpoints.docker.Host}}' 2>/dev/null || echo "")
fi

is_remote=false
endpoint_scheme=""
ssh_target=""
case "$ctx_endpoint" in
  unix://*|npipe://*|"")
    is_remote=false ;;
  ssh://*)
    is_remote=true
    endpoint_scheme="ssh"
    raw="${ctx_endpoint#ssh://}"
    if [[ "$raw" =~ ^(.+):([0-9]+)$ ]]; then
      ssh_target="${BASH_REMATCH[1]} -p ${BASH_REMATCH[2]}"
    else
      ssh_target="$raw"
    fi
    ;;
  tcp://*|http://*|https://*)
    is_remote=true
    endpoint_scheme="tcp"
    ;;
  *)
    is_remote=true
    endpoint_scheme="other"
    ;;
esac

if [[ -n "$ssh_host_override" ]]; then
  ssh_target="$ssh_host_override"
fi

# --- SSH tunnel helpers ---------------------------------------------------

start_ssh_tunnel() {
  local target=$1 forward_socket=$2
  local -a forwards=(
    "-L" "127.0.0.1:${FRONTEND_PORT}:localhost:${FRONTEND_PORT}"
    "-L" "127.0.0.1:${API_PORT}:localhost:${API_PORT}"
  )
  if [[ "$forward_socket" == "true" ]]; then
    forwards+=("-L" "127.0.0.1:${DOCKER_SOCK_LOCAL_PORT}:/var/run/docker.sock")
  fi
  if [[ -S "$SSH_CTRL" ]]; then
    echo "==> Reusing existing SSH tunnel ($SSH_CTRL)"
    return 0
  fi
  echo "==> Starting SSH tunnel to $target"
  # shellcheck disable=SC2086  # $target may carry "-p PORT"
  ssh -M -S "$SSH_CTRL" -fNT \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    "${forwards[@]}" \
    $target
}

stop_ssh_tunnel() {
  if [[ -S "$SSH_CTRL" ]]; then
    echo "==> Stopping SSH tunnel"
    ssh -S "$SSH_CTRL" -O exit dummy 2>/dev/null || true
    rm -f "$SSH_CTRL"
  fi
}

# --- Down path ------------------------------------------------------------

if [[ "$down" == "true" ]]; then
  if [[ "$is_remote" == "true" && "$endpoint_scheme" == "ssh" && -S "$SSH_CTRL" ]]; then
    export DOCKER_HOST="tcp://127.0.0.1:${DOCKER_SOCK_LOCAL_PORT}"
  fi
  docker compose -f docker-compose.e2e.yml down -v || true
  stop_ssh_tunnel
  exit 0
fi

# --- Up path: bring tunnel online before any docker call ------------------

if [[ "$is_remote" == "true" ]]; then
  if [[ -z "$ssh_target" ]]; then
    cat >&2 <<EOF
Remote docker context detected (endpoint: $ctx_endpoint) but no SSH target
available for port forwarding. Re-run with:
  scripts/e2e-up.sh --ssh-host user@host[:port]
EOF
    exit 1
  fi

  forward_socket=false
  [[ "$endpoint_scheme" == "ssh" ]] && forward_socket=true

  start_ssh_tunnel "$ssh_target" "$forward_socket"

  if [[ "$forward_socket" == "true" ]]; then
    # Route docker/dotnet/compose through the tunneled socket.
    export DOCKER_HOST="tcp://127.0.0.1:${DOCKER_SOCK_LOCAL_PORT}"
    unset DOCKER_CONTEXT 2>/dev/null || true
  fi
fi

# --- Build images --------------------------------------------------------

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
    || { echo "image $img not found on the target daemon — re-run without --no-build" >&2; exit 1; }
done

export API_IMAGE="$API_TAG"
export MIGRATOR_IMAGE="$MIGRATOR_TAG"
export FRONTEND_IMAGE="$FRONTEND_TAG"

echo "==> Bringing up stack"
docker compose -f docker-compose.e2e.yml up -d --wait --wait-timeout 180

cat <<EOF

Stack is up:
  - frontend: http://localhost:${FRONTEND_PORT}
  - api:      http://localhost:${API_PORT}
EOF

if [[ "$is_remote" == "true" ]]; then
  cat <<EOF
  (forwarded from the remote docker daemon over SSH; tunnel: $SSH_CTRL)
EOF
fi

cat <<EOF

Run E2E tests with:
  cd frontend && npx playwright test

Tear down with:
  scripts/e2e-up.sh --down
EOF
