# voice-app

## プロジェクト概要

音声入力でAI（Claude）に指示し、このプロジェクト自身のコードを自動生成・修正するセルフグロウイングアプリ。
音声がリアルタイムにチャットに表示され、音声が途切れたらClaudeがコードを書き換え、自動コミットする。

## 対応方針

- 暫定対応は行うな。根本対応のみ行え
- 後方互換性は考慮するな。不要なコードは完全に削除しろ
- 環境変数にデフォルト値・fallback を入れるな。未設定ならエラーにしろ
- 試行錯誤は最大2回まで。2回失敗したらWebSearchで調査しろ

## コード変更後の必須フロー

**コードを修正したら、以下を必ずセットで実行しろ。例外なし。**

1. `cd backend && uv run pytest tests/ -v --ignore=tests/test_e2e.py` — ユニットテスト
2. `uv run ruff check . && uv run ruff format --check .` — lint/format
3. ブランチ作成 → コミット → push
4. `gh pr create` → `gh pr merge` — PR作成&マージ
5. `git checkout develop && git pull origin develop` — developに戻る
6. `pkill -f "uvicorn app.main:app" && sleep 2 && make dev` — サーバー再起動
7. `uv run pytest tests/test_e2e.py -v` — E2Eテスト（サーバー稼働中）

途中で失敗したら修正してやり直せ。全ステップ完了するまで終わりではない。

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
```
