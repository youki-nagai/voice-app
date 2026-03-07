#!/usr/bin/env bash
set -euo pipefail

# PostgreSQL コンテナの動的ポートから DATABASE_URL を出力する。
# docker compose が割り当てたホストポートを取得して接続文字列を組み立てる。
#
# Usage: eval "$(./scripts/db-url.sh)"           # DATABASE_URL を export
#        ./scripts/db-url.sh --port              # ポート番号のみ出力

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

get_pg_port() {
    local port
    port=$(docker compose -f "$COMPOSE_FILE" port postgres 5432 2>/dev/null | sed 's/.*://')
    if [ -z "$port" ]; then
        echo "ERROR: PostgreSQL コンテナが起動していません。make db-up を実行してください。" >&2
        exit 1
    fi
    echo "$port"
}

PG_PORT=$(get_pg_port)

if [ "${1:-}" = "--port" ]; then
    echo "$PG_PORT"
else
    echo "export DATABASE_URL=postgresql+asyncpg://voiceapp:voiceapp@localhost:${PG_PORT}/voiceapp"
fi
