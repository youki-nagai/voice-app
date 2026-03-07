import json
import logging

from anthropic import AsyncAnthropic

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
あなたは音声コマンド分類器です。ユーザーの音声入力テキストが、アプリ操作コマンドかどうかを判定します。
音声認識の誤字脱字・表記ゆれを考慮して柔軟に判定してください。

## コマンド一覧

### モデル切替
- "switch-model-opus": Opusモデルに切り替える指示（例: 「オーパスに切り替えて」「opusにして」「オプスで」）
- "switch-model-sonnet": Sonnetモデルに切り替える指示（例: 「ソネットにして」「sonnetに変えて」「ソネで」）

### アプリ操作
- "new-session": 新しいチャット/セッションを作る（例: 「新しいチャット」「チャット追加して」）
- "switch-session": チャットを切り替える。params に target を含む
  - 番号指定: target=数値（例: 「チャット1に切り替えて」→ target: 1）
  - 次へ: target="next"（例: 「次のチャットに」）
  - 前へ: target="prev"（例: 「前のチャットに」）
- "toggle-cheat-sheet": ヘルプ/使い方の表示切替（例: 「使い方教えて」「ヘルプ」「チートシート」）
- "set-silence-delay": 沈黙待ち時間の変更。params に seconds を含む（0.5〜10秒）
  （例: 「待ち時間3秒にして」「沈黙5秒」）
- "split": 画面を分割する（例: 「画面分割して」「ペイン分割」）
- "unsplit": 分割を解除する（例: 「分割やめて」「1つに戻して」「パネル閉じて」）

## 判定ルール
- プログラミングの指示、質問、一般会話など、上記コマンドに該当しないものは "none"
- 迷ったら "none"（誤判定でコマンド実行するより、AIに渡すほうが安全）

## 出力形式（JSON のみ、他のテキスト不要）
コマンドの場合: {"command": "<コマンド名>", "params": {...}}
コマンドでない場合: {"command": "none"}
"""

MODEL_COMMAND_MAP = {
    "switch-model-opus": "claude-opus-4-6",
    "switch-model-sonnet": "claude-sonnet-4-6",
}

APP_COMMAND_TYPES = {
    "new-session",
    "switch-session",
    "toggle-cheat-sheet",
    "set-silence-delay",
    "split",
    "unsplit",
}


class ClassifyResult:
    __slots__ = ("is_command", "command_type", "command")

    def __init__(
        self,
        *,
        is_command: bool,
        command_type: str | None = None,
        command: dict | None = None,
    ) -> None:
        self.is_command = is_command
        self.command_type = command_type
        self.command = command


class VoiceCommandClassifier:
    def __init__(self, client: AsyncAnthropic) -> None:
        self._client = client

    async def classify(self, text: str) -> ClassifyResult:
        response = await self._client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )

        raw = response.content[0].text.strip()
        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("コマンド分類のJSON解析失敗: %s", raw)
            return ClassifyResult(is_command=False)

        command_name = result.get("command", "none")
        params = result.get("params", {})

        if command_name in MODEL_COMMAND_MAP:
            return ClassifyResult(
                is_command=True,
                command_type="model",
                command={"type": command_name, "model_id": MODEL_COMMAND_MAP[command_name]},
            )

        if command_name in APP_COMMAND_TYPES:
            return ClassifyResult(
                is_command=True,
                command_type="app",
                command={"type": command_name, **params},
            )

        return ClassifyResult(is_command=False)
