import json
from typing import ClassVar

import anthropic

from app.chat.schemas import CodeGenerationResult, FileChange

SYSTEM_PROMPT = """あなたはソフトウェア開発AIアシスタントです。
ユーザーの音声指示に基づいて、プロジェクトのコードを生成・修正します。

## ルール
- 指示に対して必要最小限の変更を行え
- 既存のコードスタイルに合わせろ
- 変更理由を簡潔に説明しろ

## 出力形式
必ず以下のJSON形式で回答しろ。それ以外のテキストは出力するな。

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

file_changes が不要な場合（質問への回答など）は空配列にしろ。
"""


class ChatService:
    # クラス変数でグローバル履歴を保持（リロード間で共有）
    _global_history: ClassVar[list[dict]] = []

    def __init__(self, api_key: str):
        self._client = anthropic.Anthropic(api_key=api_key)
        # インスタンス作成時にグローバル履歴をコピー
        self._history: list[dict] = self._global_history.copy()

    async def generate_code(
        self,
        instruction: str,
        project_context: str,
    ) -> CodeGenerationResult:
        user_message = f"""## 現在のプロジェクト構造
{project_context}

## ユーザーの指示
{instruction}"""

        self._history.append({"role": "user", "content": user_message})
        self._sync_global_history()

        response = self._client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=8192,
            system=SYSTEM_PROMPT,
            messages=self._history,
        )

        assistant_text = response.content[0].text
        self._history.append({"role": "assistant", "content": assistant_text})
        self._sync_global_history()

        return self._parse_response(assistant_text)

    def _sync_global_history(self):
        """インスタンスの履歴をグローバル履歴に同期"""
        ChatService._global_history = self._history.copy()

    def _parse_response(self, text: str) -> CodeGenerationResult:
        # まず生テキストをそのままJSONパースを試みる
        try:
            data = json.loads(text.strip())
            return self._build_result(data)
        except json.JSONDecodeError:
            pass

        # ```json ... ``` のコードブロックから最初のJSONを抽出
        import re

        match = re.search(r"```json\s*\n(.*?)\n```", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1).strip())
                return self._build_result(data)
            except json.JSONDecodeError:
                pass

        return CodeGenerationResult(explanation=text, file_changes=[])

        return self._build_result(data)

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