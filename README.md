# voice-app（仮）

音声入力でAI（Claude）に指示し、このプロジェクト自身のコードを自動生成・修正するセルフグロウイングアプリ。

## 仕組み

1. マイクボタンを押して話す
2. 音声がリアルタイムにチャットに表示される（Web Speech API）
3. 2秒の沈黙で自動送信
4. Claude がコードを生成・修正
5. 変更を自動コミット

## セットアップ

```bash
# 依存関係インストール
make install

# 環境変数設定
cp .env.example .env
# .env に ANTHROPIC_API_KEY と VOICE_APP_PROJECT_ROOT を設定

# 開発サーバー起動
make dev
```

ブラウザで http://localhost:8000 を開く。

## コマンド

```bash
make install  # 依存関係インストール
make dev      # 開発サーバー起動
make test     # テスト実行
make lint     # リント実行
make format   # フォーマット自動修正
```

## 技術スタック

- **Backend**: FastAPI + Python 3.13 + uv
- **Frontend**: HTML/JS + Web Speech API
- **AI**: Claude Code CLI（サブプロセス経由）
- **Communication**: SSE (Server-Sent Events)
