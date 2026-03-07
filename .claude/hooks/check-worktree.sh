#!/bin/bash
set -euo pipefail

# stdin から tool input の JSON を読む
input="$(cat)"

# file_path を抽出 (Edit/Write 両方対応)
file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"

if [[ -z "$file_path" ]]; then
  exit 0
fi

# ファイルが属する git リポジトリのルートを取得
file_dir="$(dirname "$file_path")"
if [[ ! -d "$file_dir" ]]; then
  exit 0
fi

repo_root="$(cd "$file_dir" && git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -z "$repo_root" ]]; then
  exit 0
fi

# ワークツリー判定: メインリポジトリの .git はディレクトリ、ワークツリーの .git はファイル
if [[ -d "$repo_root/.git" ]]; then
  echo "BLOCKED: メインリポジトリ上でのファイル編集は禁止されています。" >&2
  echo "先に EnterWorktree でワークツリーを作成してから作業してください。" >&2
  echo "編集しようとしたファイル: $file_path" >&2
  exit 2
fi

exit 0
