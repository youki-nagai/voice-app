.PHONY: install dev test lint format verify deploy

install:
	cd backend && uv sync

dev:
	cd backend && uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend --host 0.0.0.0 --port 8000 --env-file ../.env

test:
	cd backend && uv run pytest

lint:
	cd backend && uv run ruff check . && uv run ruff format --check .

format:
	cd backend && uv run ruff check --fix . && uv run ruff format .

verify:
	cd backend && uv run pytest tests/ -v && uv run ruff check . && uv run ruff format --check . && uv run pytest tests/test_e2e.py -v

deploy:
	@test -n "$(BRANCH)" || (echo "Usage: make deploy BRANCH=<name> MSG=<message>" && exit 1)
	@test -n "$(MSG)" || (echo "Usage: make deploy BRANCH=<name> MSG=<message>" && exit 1)
	./scripts/deploy.sh "$(BRANCH)" "$(MSG)"
