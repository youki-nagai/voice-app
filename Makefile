.PHONY: install dev test lint format

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
