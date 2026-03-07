---
name: adr
description: ADR（Architecture Decision Record）を作成・管理する。「ADR作成」「意思決定記録」「決定を記録」と言われた時に使用。
argument-hint: [タイトル]
---

# ADR (Architecture Decision Record)

意思決定を `docs/adr/` にMarkdownファイルとして記録する。

## ADR作成手順

### Step 1: 連番の決定

```bash
ls docs/adr/ | grep -E '^[0-9]{4}-' | sort -r | head -1
```

最後の番号 + 1 を使用する。ファイルがなければ `0001` から開始。

### Step 2: ファイル名

`docs/adr/NNNN-タイトル（kebab-case英語）.md`

例: `docs/adr/0001-use-dynamic-postgres-port.md`

### Step 3: テンプレート

```markdown
# NNNN. タイトル

Date: YYYY-MM-DD

## Status

Accepted

## Context

なぜこの決定が必要になったか。背景と制約を記述する。
git logのコミットハッシュや PR 番号があれば参照として含める。

## Decision

何を決定したか。具体的に記述する。

## Consequences

この決定によるメリット・デメリット・影響を記述する。
```

## ステータス一覧

| Status | 意味 |
|--------|------|
| Proposed | 提案中（レビュー待ち） |
| Accepted | 採用済み |
| Deprecated | 非推奨（新しいADRで置き換え） |
| Superseded by NNNN | 別のADRで置き換え済み |

## ルール

- 1つのADRには1つの決定のみ記録する
- 決定を変更する場合は新しいADRを作成し、元のADRのStatusを `Superseded by NNNN` に更新する
- Context には経緯（git log の参照、失敗パターンなど）を具体的に書く
- 曖昧な表現を避け、実装に直結する具体的な決定を記述する
