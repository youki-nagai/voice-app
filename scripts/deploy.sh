#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy.sh <branch-name> <commit-message> [worktree-name]
# 全ステップを自動実行: テスト→lint→E2E→ブランチ→コミット→PR→マージ→サーバー再起動→ワークツリー削除

BRANCH="${1:?Usage: $0 <branch-name> <commit-message> [worktree-name]}"
MESSAGE="${2:?Usage: $0 <branch-name> <commit-message> [worktree-name]}"
WORKTREE="${3:-}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ワークツリー内から実行された場合、本体リポジトリのルートを取得
MAIN_REPO="$(git -C "$REPO_ROOT" worktree list --porcelain | head -1 | sed 's/^worktree //')"

cd "$REPO_ROOT"

# E2Eテスト用の空きポートを動的に取得（ワークツリーでのポート競合を回避）
find_free_port() {
    python3 -c "import socket; s=socket.socket(); s.bind(('',0)); print(s.getsockname()[1]); s.close()"
}

E2E_PORT=$(find_free_port)

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

echo "=== Step 0: Build frontend ==="
cd frontend && npm install && npm run build && cd ..
echo ""

echo "=== Step 1: Unit tests ==="
cd backend
uv run pytest tests/ -v --ignore=tests/test_e2e.py
echo ""

echo "=== Step 2: lint/format ==="
uv run ruff check .
uv run ruff format --check .
cd ..
echo ""

echo "=== Step 3: E2E tests (pre-merge, port: ${E2E_PORT}) ==="
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend/dist --host 0.0.0.0 --port "$E2E_PORT" --env-file "$MAIN_REPO/.env" > /dev/null 2>&1 &
E2E_SERVER_PID=$!
cd ..
wait_for_server "$E2E_PORT"
echo "Server started for E2E tests (PID: ${E2E_SERVER_PID})."
cd backend
E2E_BASE_URL="http://localhost:${E2E_PORT}" uv run pytest tests/test_e2e.py -v
cd ..
kill "$E2E_SERVER_PID" 2>/dev/null || true
echo ""

echo "=== Step 4: Branch → Commit → Push ==="
git fetch origin develop
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "$BRANCH" ]; then
    echo "Already on branch $BRANCH"
else
    git checkout -b "$BRANCH"
fi
git merge origin/develop --no-edit
git add -A
# deploy.sh内でテスト・lint・E2Eは実行済みのため、lefthookの重複チェックをスキップ
LEFTHOOK=0 git commit -m "$MESSAGE

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push -u origin "$BRANCH"
echo ""

echo "=== Step 5: PR → Merge ==="
PR_URL=$(gh pr create --title "$MESSAGE" --base develop --body "Auto-deployed via scripts/deploy.sh")
echo "PR: $PR_URL"
gh pr view --web
gh pr merge --merge
echo ""

echo "=== Step 6: Back to develop ==="
git checkout develop
git pull origin develop
if [ "$REPO_ROOT" != "$MAIN_REPO" ]; then
    echo "Pulling develop in main repo..."
    git -C "$MAIN_REPO" checkout develop
    git -C "$MAIN_REPO" pull origin develop
fi
echo ""

echo "=== Step 7: Restart server (port: 8000) ==="
cd frontend && npm run build && cd ..
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 2
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend/dist --host 0.0.0.0 --port 8000 --env-file "$MAIN_REPO/.env" > /dev/null 2>&1 &
cd ..
wait_for_server 8000
echo "Server restarted."
echo ""

if [ -n "$WORKTREE" ]; then
    WORKTREE_PATH="$MAIN_REPO/.claude/worktrees/$WORKTREE"
    if [ -d "$WORKTREE_PATH" ]; then
        echo "=== Step 8: Worktree cleanup ==="
        git -C "$MAIN_REPO" worktree remove "$WORKTREE_PATH"
        WORKTREE_BRANCH="worktree-$WORKTREE"
        if git -C "$MAIN_REPO" rev-parse --verify "$WORKTREE_BRANCH" >/dev/null 2>&1; then
            git -C "$MAIN_REPO" branch -D "$WORKTREE_BRANCH"
        fi
        echo "Worktree '$WORKTREE' を削除しました。"
        echo ""
    else
        echo "WARNING: ワークツリー '$WORKTREE_PATH' が見つかりません。スキップします。" >&2
    fi
fi

echo "=== ALL STEPS COMPLETE ==="
