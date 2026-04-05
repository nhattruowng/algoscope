COMPOSE = docker compose --env-file .env

.PHONY: up down logs test build

up:
	$(COMPOSE) build sandbox-runner api web
	$(COMPOSE) up -d api web

down:
	$(COMPOSE) down --remove-orphans

logs:
	$(COMPOSE) logs -f

build:
	$(COMPOSE) build

test:
	$(COMPOSE) exec api pytest /workspace/apps/api/tests
	$(COMPOSE) exec web npm test

