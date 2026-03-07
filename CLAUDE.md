# voice-app

## プロジェクト概要

音声入力でAI（Claude）に指示し、このプロジェクト自身のコードを自動生成・修正するセルフグロウイングアプリ。
音声がリアルタイムにチャットに表示され、音声が途切れたらClaudeがコードを書き換え、自動コミットする。

## 対応方針

- 暫定対応は行うな。根本対応のみ行え
- 後方互換性は考慮するな。不要なコードは完全に削除しろ
- 環境変数にデフォルト値・fallback を入れるな。未設定ならエラーにしろ
- 試行錯誤は最大2回まで。2回失敗したらWebSearchで調査しろ
- コード変更はワークツリー（worktree）で作業しろ。他の人のブランチを直接変更するな

## コード変更後の必須フロー

**コードを修正したら `make deploy` を実行しろ。例外なし。**

```bash
make deploy BRANCH=<branch-name> MSG="<commit-message>" WORKTREE=<worktree-name>
```

- `WORKTREE` はオプション。指定すると、デプロイ完了後にそのワークツリーとブランチを自動削除する

これ1コマンドで以下が全自動実行される:
1. ユニットテスト
2. lint/format チェック
3. ブランチ作成 → コミット → push
4. PR作成 → マージ
5. developに戻る
6. サーバー再起動
7. E2Eテスト
8. ワークツリー削除（WORKTREE指定時のみ）

途中で失敗したらスクリプトが即座に停止する（`set -euo pipefail`）。
失敗原因を修正してから再度 `make deploy` を実行しろ。

## 技術スタック

- **Backend**: FastAPI (Python 3.13+)
- **Package Manager**: uv
- **Frontend**: HTML/JS (Web Speech API でリアルタイム音声認識)
- **AI**: Anthropic AsyncAnthropic (Claude) — 非同期クライアント必須
- **Communication**: SSE (Server-Sent Events) でリアルタイムストリーミング

## コマンド

```bash
make install    # 依存関係インストール (uv sync)
make dev        # 開発サーバー起動
make test       # テスト実行 (uv run pytest)
make lint       # リント実行 (uv run ruff)
make verify     # 全検証 (unit tests + lint + E2E tests)
make deploy     # コード変更後の全自動デプロイ（テスト→PR→マージ→再起動→E2E）
```
