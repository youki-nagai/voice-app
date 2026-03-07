#!/bin/bash

# pre-commit: worktree外でのコミットをブロックする

branch=$(git rev-parse --abbrev-ref HEAD)
git_dir=$(git rev-parse --git-dir 2>/dev/null)

# develop/mainへの直接コミット禁止
if [ "$branch" = "develop" ] || [ "$branch" = "main" ]; then
  echo "🚫 エラー: ${branch}ブランチへの直接コミットは禁止"
  echo "📝 worktreeを作成してから作業しろ"
  exit 1
fi

# メインリポジトリでのコミット禁止（worktree外）
if [ "$git_dir" = ".git" ]; then
  dir_suffix=$(echo "$branch" | sed 's/[\/]/-/g')
  repo_name=$(basename "$(pwd)")
  echo "🚫 エラー: メインリポジトリでのコミットは禁止"
  echo ""
  echo "📝 worktreeを使え:"
  echo "   git checkout develop"
  echo "   git worktree add -b $branch ../${repo_name}-${dir_suffix} HEAD"
  echo "   cp .env ../${repo_name}-${dir_suffix}/.env"
  echo "   cd ../${repo_name}-${dir_suffix}"
  exit 1
fi

exit 0
