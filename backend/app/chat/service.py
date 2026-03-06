import json

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
    def __init__(self, api_key: str):
        self._client = anthropic.Anthropic(api_key=api_key)
        self._history: list[dict] = []

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

        response = self._client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8192,
            system=SYSTEM_PROMPT,
            messages=self._history,
        )

        assistant_text = response.content[0].text
        self._history.append({"role": "assistant", "content": assistant_text})

        return self._parse_response(assistant_text)

    def _parse_response(self, text: str) -> CodeGenerationResult:
        # JSON部分を抽出
        json_text = text
        if "```json" in text:
            json_text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            json_text = text.split("```")[1].split("```")[0]

        try:
            data = json.loads(json_text.strip())
        except json.JSONDecodeError:
            return CodeGenerationResult(explanation=text, file_changes=[])

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
