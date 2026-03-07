#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy.sh <branch-name> <commit-message>
# 全ステップを自動実行: テスト→lint→E2E→ブランチ→コミット→PR→マージ→サーバー再起動

BRANCH="${1:?Usage: $0 <branch-name> <commit-message>}"
MESSAGE="${2:?Usage: $0 <branch-name> <commit-message>}"

cd "$(dirname "$0")/.."

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
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 2
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend --host 0.0.0.0 --port 8000 --env-file ../.env > /dev/null 2>&1 &
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
gh pr merge --merge
echo ""

echo "=== Step 6: Back to develop ==="
git checkout develop
git pull origin develop
echo ""

echo "=== Step 7: Restart server ==="
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 2
cd backend
nohup uv run uvicorn app.main:app --reload --reload-dir . --reload-dir ../frontend --host 0.0.0.0 --port 8000 --env-file ../.env > /dev/null 2>&1 &
cd ..
wait_for_server
echo "Server restarted."
echo ""

echo "=== ALL STEPS COMPLETE ==="
