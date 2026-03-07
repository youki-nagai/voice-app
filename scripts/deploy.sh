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

wait_for_server() {
    for i in $(seq 1 10); do
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            return 0
        fi
        sleep 1
    done
    echo "ERROR: サーバーが起動しませんでした" >&2
    return 1
}

echo "=== Step 1: Unit tests ==="
cd backend
uv run pytest tests/ -v --ignore=tests/test_e2e.py
echo ""

echo "=== Step 2: lint/format ==="
uv run ruff check .
uv run ruff format --check .
cd ..
echo ""

echo "=== Step 3: E2E tests (pre-merge) ==="
echo "Building frontend..."
cd frontend && npm install && npm run build && cd ..
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 2
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend/dist --host 0.0.0.0 --port 8000 --env-file ../.env > /dev/null 2>&1 &
cd ..
wait_for_server
echo "Server started for E2E tests."
cd backend
uv run pytest tests/test_e2e.py -v
cd ..
echo ""

echo "=== Step 4: Branch → Commit → Push ==="
git checkout -b "$BRANCH"
git add -A
git commit -m "$MESSAGE

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
echo ""

echo "=== Step 7: Restart server ==="
cd frontend && npm run build && cd ..
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 2
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend/dist --host 0.0.0.0 --port 8000 --env-file ../.env > /dev/null 2>&1 &
cd ..
wait_for_server
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
