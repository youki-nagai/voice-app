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
「〜を作って」「〜を修正して」「〜ファイルを追加して」→ JSON形式で回答。

## JSON形式（コード変更時のみ）
{"explanation": "説明", "file_changes": [{"path": "相対パス", "content": "内容", "action": "create|update|delete"}]}

## コード変更のルール
- 必要最小限の変更のみ
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
        """ストリーミングでコード生成し、テキストチャンクをyield。"""
        if self._looks_like_code_request(instruction):
            user_message = f"## 現在のプロジェクト構造\n{project_context}\n\n## ユーザーの指示\n{instruction}"
        else:
            user_message = instruction

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

    @staticmethod
    def _looks_like_code_request(text: str) -> bool:
        """コード変更を求めている指示かどうかを判定"""
        keywords = [
            "作って",
            "作成",
            "追加",
            "修正",
            "変更",
            "削除",
            "更新",
            "書いて",
            "書き換え",
            "実装",
            "リファクタ",
            "ファイル",
            "コード",
            "関数",
            "クラス",
            "メソッド",
            "API",
            "create",
            "add",
            "fix",
            "update",
            "delete",
            "implement",
        ]
        normalized = text.lower()
        return any(kw in normalized for kw in keywords)

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
