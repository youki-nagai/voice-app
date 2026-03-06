---
name: backend-python
description: backend/ 配下の Python ファイルを編集する際に使用。DI パターン、例外クラス、API 規約などプロジェクト固有のルールを提供する。
---

# バックエンド Python 規約

## 設計決定

- datetime: 常に `datetime.now(UTC)` を使え
- `__init__.py`: 常に空にしろ

## Dependency Injection 規約

- `Annotated` 型エイリアスで依存を定義しろ
- ルーター関数の引数で直接 `Depends()` を書くな
- 依存の定義場所: `app/dependencies.py` に集約しろ

## API設計

- RESTful 5アクションのみ: index, show, create, update, destroy
- 並び順を厳守しろ: index → show → create → update → destroy
