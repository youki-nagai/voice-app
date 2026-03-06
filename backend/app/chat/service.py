import json
import re
from collections.abc import AsyncGenerator
from typing import ClassVar

import anthropic

from app.chat.schemas import CodeGenerationResult, FileChange

SYSTEM_PROMPT = """あなたはソフトウェア開発AIアシスタントです。
ユーザーの音声指示に基づいて、プロジェクトのコードを生成・修正します。
日本語で簡潔に回答しろ。

## 質問・会話への対応
コード変更が不要な場合（質問、相談、説明の依頼など）は、自然な日本語でそのまま回答しろ。
JSONで返す必要はない。

## コード変更が必要な場合
ファイルの作成・修正・削除が必要な場合のみ、以下のJSON形式で回答しろ。

```json
{
  "explanation": "変更内容の説明（日本語）",
  "file_changes": [
    {
      "path": "ファイルパス（プロジェクトルートからの相対パス）",
      "content": "ファイルの完全な内容",
      "action": "create | update | delete"
    }
  ]
}
```

## コード変更のルール
- 指示に対して必要最小限の変更を行え
- 既存のコードスタイルに合わせろ
"""


class ChatService:
    _global_history: ClassVar[list[dict]] = []

    def __init__(self, api_key: str):
        self._client = anthropic.Anthropic(api_key=api_key)
        self._history: list[dict] = self._global_history.copy()

    async def stream_generate_code(
        self,
        instruction: str,
        project_context: str,
    ) -> AsyncGenerator[str]:
        """ストリーミングでコード生成し、テキストチャンクをyield。最後にNoneをyield。"""
        user_message = f"""## 現在のプロジェクト構造
{project_context}

## ユーザーの指示
{instruction}"""

        self._history.append({"role": "user", "content": user_message})
        self._sync_global_history()

        full_text = ""
        with self._client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=8192,
            system=SYSTEM_PROMPT,
            messages=self._history,
        ) as stream:
            for text in stream.text_stream:
                full_text += text
                yield text

        self._history.append({"role": "assistant", "content": full_text})
        self._sync_global_history()

    def parse_response(self, text: str) -> CodeGenerationResult:
        # まず生テキストをそのままJSONパース
        try:
            data = json.loads(text.strip())
            return self._build_result(data)
        except json.JSONDecodeError:
            pass

        # ```json ... ``` のコードブロックから抽出
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
