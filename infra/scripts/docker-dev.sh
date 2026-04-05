#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ENV_FILE="$REPO_ROOT/.env"
ENV_EXAMPLE="$REPO_ROOT/.env.example"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Khong tim thay Docker Compose. Hay cai Docker Desktop hoac docker-compose truoc."
  exit 1
fi

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
      cp "$ENV_EXAMPLE" "$ENV_FILE"
      echo "Da tao .env tu .env.example"
    else
      echo "Khong tim thay .env.example de tao file moi truong."
      exit 1
    fi
  fi
}

ensure_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Docker daemon chua san sang. Hay mo Docker Desktop roi thu lai."
    exit 1
  fi
}

compose() {
  # shellcheck disable=SC2086
  $COMPOSE_CMD --env-file "$ENV_FILE" -f "$REPO_ROOT/docker-compose.yml" "$@"
}

build_stack() {
  ensure_env
  ensure_docker
  echo "Dang build sandbox-runner, api, web..."
  compose build sandbox-runner api web
}

up_stack() {
  build_stack
  echo "Dang khoi dong api va web..."
  compose up -d api web
  echo "Web UI: http://localhost:5173"
  echo "API Docs: http://localhost:8000/docs"
}

down_stack() {
  ensure_env
  compose down --remove-orphans
}

logs_stack() {
  ensure_env
  compose logs -f "${2:-}"
}

test_stack() {
  ensure_env
  compose exec api pytest /workspace/apps/api/tests
  compose exec web npm test
}

status_stack() {
  ensure_env
  compose ps
}

usage() {
  cat <<'EOF'
Su dung:
  sh infra/scripts/docker-dev.sh up
  sh infra/scripts/docker-dev.sh build
  sh infra/scripts/docker-dev.sh down
  sh infra/scripts/docker-dev.sh logs [service]
  sh infra/scripts/docker-dev.sh test
  sh infra/scripts/docker-dev.sh ps

Lenh:
  up      Build image can thiet va chay api + web
  build   Chi build image sandbox-runner, api, web
  down    Dung docker compose stack
  logs    Xem log, co the truyen ten service
  test    Chay backend test va frontend test trong container
  ps      Xem trang thai container
EOF
}

COMMAND="${1:-up}"

case "$COMMAND" in
  up)
    up_stack
    ;;
  build)
    build_stack
    ;;
  down)
    down_stack
    ;;
  logs)
    logs_stack "$@"
    ;;
  test)
    test_stack
    ;;
  ps)
    status_stack
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    echo "Lenh khong hop le: $COMMAND"
    usage
    exit 1
    ;;
esac
