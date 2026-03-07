---
name: frontend-shadcn
description: frontend/ 配下のUIコンポーネントを作成・編集する際に使用。shadcn/ui の使用ルールとコンポーネント選定ガイド。
---

# shadcn/ui 使用ルール

## 絶対ルール

- UIコンポーネントを新規作成・編集する前に、shadcn/ui に該当コンポーネントがないか必ず調べろ
- context7 MCP で shadcn/ui のドキュメントを検索して、最新の使い方を確認しろ
- shadcn コンポーネントが存在する場合、手書きで同等のものを作るな。shadcn を使え
- shadcn コンポーネントはできる限り default の variant/size を使え。カスタムスタイルは最小限にしろ
- `frontend/src/components/ui/` 配下の shadcn コンポーネントは直接修正禁止。ラッパーを作れ

## shadcn コンポーネントのインストール

```bash
cd frontend && bunx shadcn@latest add <component-name>
```

## よく使うコンポーネントの対応表

| やりたいこと | shadcn コンポーネント |
|---|---|
| ボタン | `Button` (variant: default/destructive/outline/secondary/ghost/link) |
| トグル切替 | `ToggleGroup` (type="single") |
| テキスト入力（複数行） | `Textarea` |
| サイドパネル/ドロワー | `Sheet` (side: top/right/bottom/left) |
| サイドバーナビゲーション | `Sidebar` (SidebarProvider, SidebarContent, SidebarGroup) |
| 折りたたみ | `Collapsible` (CollapsibleTrigger, CollapsibleContent) |
| ツールチップ | `Tooltip` (TooltipProvider, TooltipTrigger, TooltipContent) |
| スクロール領域 | `ScrollArea` |
| 区切り線 | `Separator` |
| バッジ/ステータス表示 | `Badge` (variant: default/secondary/destructive/outline) |
| ドロップダウン | `DropdownMenu` |
| ダイアログ/モーダル | `Dialog` |
| タブ | `Tabs` |
| カード | `Card` |
| アバター | `Avatar` |
| 入力フィールド | `Input` |
| セレクト | `Select` |

## カスタムコンポーネントを作ってよいケース

- shadcn に該当するコンポーネントが存在しない場合（StatusDot のようなドメイン固有のもの）
- shadcn コンポーネントのラッパーとして、プロジェクト固有の variant を追加する場合（IconButton など）
- 複数の shadcn コンポーネントを組み合わせた molecule/organism レベルのコンポーネント

## context7 での調べ方

```
1. resolve-library-id で "shadcn/ui" を検索 → library ID を取得
2. query-docs で具体的なコンポーネント名と使い方を検索
```
