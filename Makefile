.PHONY: install dev test lint format verify deploy build-frontend

install:
	cd backend && uv sync
	cd frontend && npm install

build-frontend:
	cd frontend && npm run build

dev:
	cd frontend && npm run build
	cd backend && uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend/dist --host 0.0.0.0 --port 8000 --env-file ../.env

test:
	cd backend && uv run pytest
	cd frontend && npm test

lint:
	cd backend && uv run ruff check . && uv run ruff format --check .
	cd frontend && npm run lint

format:
	cd backend && uv run ruff check --fix . && uv run ruff format .

verify:
	@test -n "$(E2E_BASE_URL)" || (echo "ERROR: E2E_BASE_URL is required. Usage: make verify E2E_BASE_URL=http://localhost:<port>" && exit 1)
	cd backend && uv run pytest tests/ -v && uv run ruff check . && uv run ruff format --check . && E2E_BASE_URL="$(E2E_BASE_URL)" uv run pytest tests/test_e2e.py -v

deploy:
	@test -n "$(BRANCH)" || (echo "Usage: make deploy BRANCH=<name> MSG=<message> [WORKTREE=<name>]" && exit 1)
	@test -n "$(MSG)" || (echo "Usage: make deploy BRANCH=<name> MSG=<message> [WORKTREE=<name>]" && exit 1)
	./scripts/deploy.sh "$(BRANCH)" "$(MSG)" "$(WORKTREE)"
