.PHONY: install dev test lint format verify deploy build-frontend db-up db-down

install:
	cd backend && uv sync
	cd frontend && bun install

build-frontend:
	cd frontend && bun run build

dev:
	@MAIN_REPO=$$(git worktree list --porcelain | head -1 | sed 's/^worktree //'); \
	REPO_ROOT=$$(pwd); \
	eval "$$(./scripts/db-url.sh)"; \
	if [ "$$REPO_ROOT" = "$$MAIN_REPO" ]; then \
		API_PORT=8000; \
	else \
		API_PORT=$$(python3 -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()"); \
	fi; \
	echo "Starting backend on port $$API_PORT"; \
	echo "Starting frontend on http://localhost:5173"; \
	echo "DATABASE_URL=$$DATABASE_URL"; \
	trap 'kill 0' EXIT; \
	(cd backend && DATABASE_URL="$$DATABASE_URL" uv run uvicorn app.main:app --reload --reload-dir . --host 0.0.0.0 --port $$API_PORT --env-file "$$MAIN_REPO/.env") & \
	(cd frontend && bun run dev) & \
	wait

test:
	cd backend && uv run pytest
	cd frontend && bun run test

lint:
	cd backend && uv run ruff check . && uv run ruff format --check .
	cd frontend && bun run lint

format:
	cd backend && uv run ruff check --fix . && uv run ruff format .
	cd frontend && bun run format

verify:
	@test -n "$(E2E_BASE_URL)" || (echo "ERROR: E2E_BASE_URL is required. Usage: make verify E2E_BASE_URL=http://localhost:<port>" && exit 1)
	cd backend && uv run pytest tests/ -v && uv run ruff check . && uv run ruff format --check . && E2E_BASE_URL="$(E2E_BASE_URL)" uv run pytest tests/test_e2e.py -v

deploy:
	@test -n "$(BRANCH)" || (echo "Usage: make deploy BRANCH=<name> MSG=<message>" && exit 1)
	@test -n "$(MSG)" || (echo "Usage: make deploy BRANCH=<name> MSG=<message>" && exit 1)
	./scripts/deploy.sh "$(BRANCH)" "$(MSG)"

db-up:
	docker compose up -d postgres

db-down:
	docker compose down
