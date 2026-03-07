#!/bin/bash

# worktree外での作業ブランチ切り替えを検知し、worktree使用を案内する

branch=$(git rev-parse --abbrev-ref HEAD)

# develop/main は除外
if [ "$branch" = "develop" ] || [ "$branch" = "main" ]; then
  exit 0
fi

# worktree内かチェック
# メインリポジトリ: .git はディレクトリ
# worktree: .git はファイル（gitdir参照）
git_dir=$(git rev-parse --git-dir 2>/dev/null)
if [ "$git_dir" = ".git" ]; then
  # メインリポジトリ内で作業ブランチに切り替えた
  dir_suffix=$(echo "$branch" | sed 's/[\/]/-/g')
  repo_name=$(basename "$(pwd)")

  echo ""
  echo "🚫 エラー: メインリポジトリで作業ブランチに切り替えました"
  echo ""
  echo "📝 CLAUDE.md規約: コード変更は必ずworktreeを作成してから行え"
  echo ""
  echo "🔧 正しい手順:"
  echo "   1. developに戻る:"
  echo "      git checkout develop"
  echo ""
  echo "   2. worktreeを作成する:"
  echo "      git worktree add -b $branch ../${repo_name}-${dir_suffix} HEAD"
  echo ""
  echo "   3. .envをコピーする:"
  echo "      cp .env ../${repo_name}-${dir_suffix}/.env"
  echo ""
  echo "   4. worktreeに移動する:"
  echo "      cd ../${repo_name}-${dir_suffix}"
  echo ""
  exit 1
fi

exit 0
