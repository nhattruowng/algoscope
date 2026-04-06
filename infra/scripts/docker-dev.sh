#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ENV_FILE="$REPO_ROOT/.env"
ENV_EXAMPLE="$REPO_ROOT/.env.example"
SERVICES="sandbox-runner api web"

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

print_urls() {
  echo "Web UI: http://localhost:3001"
  echo "API Docs: http://localhost:8001/docs"
}

build_cached() {
  ensure_env
  ensure_docker
  echo "Build nhanh bang cache cho: $SERVICES"
  # shellcheck disable=SC2086
  compose build $SERVICES
}

build_fresh() {
  ensure_env
  ensure_docker
  echo "Build sach hoan toan cho: $SERVICES"
  # shellcheck disable=SC2086
  compose build --no-cache --pull $SERVICES
}

up_stack() {
  ensure_env
  ensure_docker
  echo "Khoi dong api va web bang build cache..."
  compose up -d --build api web
  print_urls
}

up_fresh_stack() {
  ensure_env
  ensure_docker
  echo "Dung stack cu va xoa volume de chay sach..."
  compose down --remove-orphans --volumes || true
  build_fresh
  echo "Khoi dong lai api va web voi container moi..."
  compose up -d --force-recreate api web
  print_urls
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
  sh infra/scripts/docker-dev.sh up-fresh
  sh infra/scripts/docker-dev.sh build
  sh infra/scripts/docker-dev.sh build-fresh
  sh infra/scripts/docker-dev.sh down
  sh infra/scripts/docker-dev.sh logs [service]
  sh infra/scripts/docker-dev.sh test
  sh infra/scripts/docker-dev.sh ps

Lenh:
  up          Chay nhanh bang cache, phu hop cho dev hang ngay
  up-fresh    Down stack cu, xoa volume, build sach va recreate api + web
  build       Build nhanh bang cache
  build-fresh Build sach khong dung cache
  down        Dung docker compose stack
  logs        Xem log, co the truyen ten service
  test        Chay backend test va frontend test trong container
  ps          Xem trang thai container
EOF
}

COMMAND="${1:-up}"

case "$COMMAND" in
  up)
    up_stack
    ;;
  up-fresh)
    up_fresh_stack
    ;;
  build)
    build_cached
    ;;
  build-fresh)
    build_fresh
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
