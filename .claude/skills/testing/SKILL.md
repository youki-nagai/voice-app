---
name: testing
description: backend/tests/ 配下のテストコードを作成・編集する際に使用。
---

# テスト規約

## 命名規則

- `test_given_前提条件_when_操作_then_結果`

## FastAPIテストでの依存オーバーライド

- `app.dependency_overrides[get_xxx] = lambda: mock` を使え
- `unittest.mock.patch()` でモジュールレベル変数をモックするな
