---
name: commit-push
description: 変更をコミットしてリモートに push する際に使用。PR 作成後は必ずブラウザで開く。
---

# コミット & プッシュ

## 前提条件

- コミット前に `make test` と `make lint` を通せ。失敗したら修正しろ

## ルール

- コミットメッセージは HEREDOCで渡せ
- `gh pr create` 実行後、必ず `gh pr view --web` でブラウザを開け
- PR作成とブラウザ表示はセットで行え。URLだけ返して終わるな
- 全ステップを可能な限り少ないメッセージで完了しろ
