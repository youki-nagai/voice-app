#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy.sh <branch-name> <commit-message>
# 全ステップを自動実行: テスト→lint→E2E→ブランチ→コミット→PR→マージ→サーバー再起動

BRANCH="${1:?Usage: $0 <branch-name> <commit-message>}"
MESSAGE="${2:?Usage: $0 <branch-name> <commit-message>}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ワークツリー内から実行された場合、本体リポジトリのルートを取得
MAIN_REPO="$(git -C "$REPO_ROOT" worktree list --porcelain | head -1 | sed 's/^worktree //')"

cd "$REPO_ROOT"

# E2Eテスト用の空きポートを動的に取得（ワークツリーでのポート競合を回避）
find_free_port() {
    python3 -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()"
}

E2E_PORT=$(find_free_port)
E2E_SERVER_PID=""

# E2Eサーバーのクリーンアップ（テスト失敗・スクリプト中断時にも確実に停止）
cleanup_e2e_server() {
    if [ -n "$E2E_SERVER_PID" ]; then
        kill "$E2E_SERVER_PID" 2>/dev/null || true
        wait "$E2E_SERVER_PID" 2>/dev/null || true
        E2E_SERVER_PID=""
    fi
}
trap cleanup_e2e_server EXIT

wait_for_server() {
    local port="$1"
    for i in $(seq 1 10); do
        if curl -s "http://localhost:${port}" > /dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    echo "ERROR: サーバーが起動しませんでした (port: ${port})" >&2
    return 1
}

echo "=== Step 0: Ensure PostgreSQL is running ==="
docker compose -f "$REPO_ROOT/docker-compose.yml" up -d postgres
eval "$("$REPO_ROOT/scripts/db-url.sh")"
echo "DATABASE_URL=$DATABASE_URL"
echo ""

echo "=== Step 1: Build frontend ==="
cd frontend && bun install && bun run build && cd ..
echo ""

echo "=== Step 2: Unit tests ==="
cd backend
uv run pytest tests/ -v --ignore=tests/test_e2e.py
echo ""

echo "=== Step 3: lint/format ==="
uv run ruff check .
uv run ruff format --check .
cd ..
echo ""

echo "=== Step 4: E2E tests (pre-merge, port: ${E2E_PORT}) ==="
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend/dist --host 0.0.0.0 --port "$E2E_PORT" --env-file "$MAIN_REPO/.env" > /dev/null 2>&1 &
E2E_SERVER_PID=$!
cd ..
wait_for_server "$E2E_PORT"
echo "Server started for E2E tests (PID: ${E2E_SERVER_PID})."
cd backend
E2E_BASE_URL="http://localhost:${E2E_PORT}" uv run pytest tests/test_e2e.py -v
cd ..
cleanup_e2e_server
echo ""

echo "=== Step 5: Branch → Commit → Push ==="
git fetch origin develop
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "$BRANCH" ]; then
    echo "Already on branch $BRANCH"
else
    # deploy.sh内でテスト・lint・E2Eは実行済みのため、lefthookのworktreeチェックをスキップ
    LEFTHOOK=0 git checkout -b "$BRANCH"
fi
LEFTHOOK=0 git merge origin/develop --no-edit
git add -A
# deploy.sh内でテスト・lint・E2Eは実行済みのため、lefthookの重複チェックをスキップ
LEFTHOOK=0 git commit -m "$MESSAGE

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push -u origin "$BRANCH"
echo ""

echo "=== Step 6: PR → Merge ==="
PR_URL=$(gh pr create --title "$MESSAGE" --base develop --body "Auto-deployed via scripts/deploy.sh")
echo "PR: $PR_URL"
gh pr view --web
gh pr merge --merge
echo ""

echo "=== Step 7: Back to develop ==="
if [ "$REPO_ROOT" = "$MAIN_REPO" ]; then
    LEFTHOOK=0 git checkout develop
    git pull origin develop
else
    echo "Pulling develop in main repo..."
    git -C "$MAIN_REPO" pull origin develop
fi
echo ""

echo "=== Step 8: Restart server (port: 8000 + 5173) ==="
cd "$MAIN_REPO"
# メインリポの PostgreSQL を起動し、DATABASE_URL を取得
docker compose -f "$MAIN_REPO/docker-compose.yml" up -d postgres
eval "$("$MAIN_REPO/scripts/db-url.sh")"
echo "DATABASE_URL=$DATABASE_URL"
# 既存のdev serverプロセスをすべて停止
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2
# バックエンド起動
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --host 0.0.0.0 --port 8000 --env-file "$MAIN_REPO/.env" > /dev/null 2>&1 &
cd ..
# フロントエンド（Vite HMR）起動
cd frontend
nohup bun run dev > /dev/null 2>&1 &
cd ..
wait_for_server 8000
wait_for_server 5173
echo "Server restarted (backend: 8000, frontend: 5173)."
echo ""

echo "=== Step 9: Post-deploy guidance ==="
if [ "$REPO_ROOT" != "$MAIN_REPO" ]; then
    echo "ワークツリーから実行されました。メインリポジトリに移動してください:"
    echo ""
    echo ">>> cd $MAIN_REPO <<<"
    echo ""
    echo "ワークツリーの削除は手動で行ってください:"
    echo "  git -C $MAIN_REPO worktree remove $REPO_ROOT --force"
else
    echo "Main repo - no worktree to clean up."
fi
echo ""

echo "=== ALL STEPS COMPLETE ==="
