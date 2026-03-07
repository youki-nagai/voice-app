#!/usr/bin/env bash
set -euo pipefail

# shadcn コンポーネント (frontend/src/components/ui/) の既存ファイル変更を禁止する
# 新規追加は許可する
# lefthook から {staged_files} として引数が渡される

modified_shadcn_files=()
for file in "$@"; do
  if [[ "$file" == frontend/src/components/ui/* ]]; then
    # 新規追加(A)は許可、変更(M)のみブロック
    status=$(git diff --cached --name-status -- "$file" | awk '{print $1}')
    if [[ "$status" != "A" ]]; then
      modified_shadcn_files+=("$file")
    fi
  fi
done

if [[ ${#modified_shadcn_files[@]} -gt 0 ]]; then
  echo "ERROR: shadcn コンポーネントの変更は禁止されています"
  echo "変更が必要な場合はラッパーコンポーネントを作成してください"
  echo ""
  echo "変更されたファイル:"
  for file in "${modified_shadcn_files[@]}"; do
    echo "  - $file"
  done
  exit 1
fi
