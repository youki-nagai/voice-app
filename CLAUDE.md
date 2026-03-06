# voice-app

## プロジェクト概要

音声入力でAI（Claude）に指示し、このプロジェクト自身のコードを自動生成・修正するセルフグロウイングアプリ。
音声がリアルタイムにチャットに表示され、音声が途切れたらClaudeがコードを書き換え、自動コミットする。

## 対応方針

- 暫定対応は行うな。根本対応のみ行え
- 後方互換性は考慮するな。不要なコードは完全に削除しろ
- 環境変数にデフォルト値・fallback を入れるな。未設定ならエラーにしろ
- 試行錯誤は最大2回まで。2回失敗したらWebSearchで調査しろ
- コード変更後は必ず自動コミットしろ

## 技術スタック

- **Backend**: FastAPI (Python 3.13+)
- **Package Manager**: uv
- **Frontend**: HTML/JS (Web Speech API でリアルタイム音声認識)
- **AI**: Anthropic Python SDK (Claude)
- **Communication**: WebSocket (リアルタイム双方向通信)

## コマンド

```bash
make install    # 依存関係インストール (uv sync)
make dev        # 開発サーバー起動
make test       # テスト実行 (uv run pytest)
make lint       # リント実行 (uv run ruff)
```
