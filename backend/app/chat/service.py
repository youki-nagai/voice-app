import json
import re
from collections.abc import AsyncGenerator
from typing import ClassVar

import anthropic

from app.chat.schemas import CodeGenerationResult, FileChange

SYSTEM_PROMPT = """あなたはソフトウェア開発AIアシスタントです。日本語で簡潔に回答しろ。

## 最重要ルール: 回答形式の選択
お前の回答は「普通のテキスト」がデフォルトだ。JSONで返すな。
ユーザーが明確にファイルの作成・修正・削除を求めた場合だけ、JSON形式を使え。

質問、相談、説明、雑談 → 普通の日本語テキストで回答。絶対にJSONにするな。
「〜を作って」「〜を修正して」「〜を変えて」「〜を直して」「〜を追加して」→ JSON形式で回答。

## JSON形式（コード変更時のみ）
{"explanation": "説明", "file_changes": [{"path": "相対パス", "content": "全内容", "action": "create|update|delete"}]}

## コード変更のルール
- 必要最小限の変更のみ
- 既存のコードスタイルに合わせろ
- contentにはファイルの完全な内容を含めろ（差分ではなく全文）
"""


class ChatService:
    _global_history: ClassVar[list[dict]] = []

    def __init__(self, api_key: str):
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._history: list[dict] = self._global_history.copy()

    async def stream_generate_code(
        self,
        instruction: str,
        project_context: str,
    ) -> AsyncGenerator[str]:
        """ストリーミングでコード生成し、テキストチャンクをyield。"""
        self._history.append({"role": "user", "content": instruction})
        self._sync_global_history()

        system = SYSTEM_PROMPT + f"\n\n## 現在のプロジェクト構造\n{project_context}"

        full_text = ""
        async with self._client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=8192,
            system=system,
            messages=self._history,
        ) as stream:
            async for text in stream.text_stream:
                full_text += text
                yield text

        self._history.append({"role": "assistant", "content": full_text})
        self._sync_global_history()

    def parse_response(self, text: str) -> CodeGenerationResult:
        try:
            data = json.loads(text.strip())
            return self._build_result(data)
        except json.JSONDecodeError:
            pass

        match = re.search(r"```json\s*\n(.*?)\n```", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1).strip())
                return self._build_result(data)
            except json.JSONDecodeError:
                pass

        return CodeGenerationResult(explanation=text, file_changes=[])

    def get_history(self) -> list[dict]:
        return self._history.copy()

    def _sync_global_history(self):
        ChatService._global_history = self._history.copy()

    def _build_result(self, data: dict) -> CodeGenerationResult:
        file_changes = [
            FileChange(
                path=fc["path"],
                content=fc.get("content", ""),
                action=fc["action"],
            )
            for fc in data.get("file_changes", [])
        ]

        return CodeGenerationResult(
            explanation=data.get("explanation", ""),
            file_changes=file_changes,
        )
