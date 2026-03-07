#!/usr/bin/env bash
set -euo pipefail

# shadcn コンポーネント (frontend/src/components/ui/) の変更を禁止する
# lefthook から {staged_files} として引数が渡される

shadcn_files=()
for file in "$@"; do
  if [[ "$file" == frontend/src/components/ui/* ]]; then
    shadcn_files+=("$file")
  fi
done

if [[ ${#shadcn_files[@]} -gt 0 ]]; then
  echo "ERROR: shadcn コンポーネントの変更は禁止されています"
  echo "変更が必要な場合はラッパーコンポーネントを作成してください"
  echo ""
  echo "変更されたファイル:"
  for file in "${shadcn_files[@]}"; do
    echo "  - $file"
  done
  exit 1
fi
