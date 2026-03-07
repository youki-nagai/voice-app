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

_JSON_EXTRACTORS = [
    lambda text: json.loads(text.strip()),
    lambda text: json.loads(re.search(r"```json\s*\n(.*?)\n```", text, re.DOTALL).group(1).strip()),
    lambda text: json.loads(re.search(r'\{"explanation".*"file_changes"\s*:\s*\[.*\]\s*\}', text, re.DOTALL).group(0)),
]


class ChatService:
    _history: ClassVar[list[dict]] = []

    def __init__(self, api_key: str):
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def stream_generate_code(
        self,
        instruction: str,
        project_context: str,
    ) -> AsyncGenerator[str]:
        ChatService._history.append({"role": "user", "content": instruction})

        system = SYSTEM_PROMPT + f"\n\n## 現在のプロジェクト構造\n{project_context}"

        full_text = ""
        async with self._client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=8192,
            system=system,
            messages=ChatService._history,
        ) as stream:
            async for text in stream.text_stream:
                full_text += text
                yield text

        ChatService._history.append({"role": "assistant", "content": full_text})

    @staticmethod
    def parse_response(text: str) -> CodeGenerationResult:
        for extractor in _JSON_EXTRACTORS:
            try:
                data = extractor(text)
                return CodeGenerationResult(
                    explanation=data.get("explanation", ""),
                    file_changes=[
                        FileChange(path=fc["path"], content=fc.get("content", ""), action=fc["action"])
                        for fc in data.get("file_changes", [])
                    ],
                )
            except (json.JSONDecodeError, AttributeError, TypeError, KeyError):
                continue

        return CodeGenerationResult(explanation=text, file_changes=[])

    @staticmethod
    def get_history() -> list[dict]:
        return ChatService._history.copy()
