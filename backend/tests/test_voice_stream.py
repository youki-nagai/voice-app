import json
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.chat.schemas import CodeGenerationResult, FileChange
from app.main import app


async def fake_stream_chunks(*chunks):
    for chunk in chunks:
        yield chunk


class TestVoiceStream:
    def setup_method(self):
        self._client = TestClient(app)

    @patch("app.voice.router.get_project_root", return_value="/tmp/test")
    @patch("app.voice.router.get_anthropic_api_key", return_value="test-key")
    @patch("app.voice.router.CodeExecutorService")
    @patch("app.voice.router.ChatService")
    def test_given_valid_instruction_when_stream_then_returns_sse_events(
        self, mock_chat_cls, mock_executor_cls, mock_key, mock_root
    ):
        mock_chat = MagicMock()
        full_response = (
            '{"explanation": "テストファイルを作成しました", '
            '"file_changes": [{"path": "test.py", "content": "print(1)", "action": "create"}]}'
        )
        mock_chat.stream_generate_code = MagicMock(return_value=fake_stream_chunks(full_response))
        mock_chat.parse_response.return_value = CodeGenerationResult(
            explanation="テストファイルを作成しました",
            file_changes=[FileChange(path="test.py", content="print(1)", action="create")],
        )
        mock_chat_cls.return_value = mock_chat

        mock_executor = MagicMock()
        mock_executor.get_project_context.return_value = "test context"
        mock_executor.apply_changes.return_value = [{"path": "test.py", "action": "created"}]
        mock_executor.auto_commit.return_value = "voice: テスト"
        mock_executor_cls.return_value = mock_executor

        response = self._client.post(
            "/api/voice/stream",
            json={"text": "テストファイルを作成して"},
        )

        assert response.status_code == 200

        events = self._parse_sse_events(response.text)

        types = [e["type"] for e in events]
        assert "status" in types
        assert "ai_chunk" in types
        assert "ai_done" in types
        assert "file_change" in types
        assert "commit" in types
        assert "complete" in types

        ai_done_event = next(e for e in events if e["type"] == "ai_done")
        assert ai_done_event["explanation"] == "テストファイルを作成しました"

        commit_event = next(e for e in events if e["type"] == "commit")
        assert commit_event["message"] == "voice: テスト"

    @patch("app.voice.router.get_project_root", return_value="/tmp/test")
    @patch("app.voice.router.get_anthropic_api_key", return_value="test-key")
    @patch("app.voice.router.CodeExecutorService")
    @patch("app.voice.router.ChatService")
    def test_given_no_file_changes_when_stream_then_skips_commit(
        self, mock_chat_cls, mock_executor_cls, mock_key, mock_root
    ):
        mock_chat = MagicMock()
        full_response = '{"explanation": "質問への回答です", "file_changes": []}'
        mock_chat.stream_generate_code = MagicMock(return_value=fake_stream_chunks(full_response))
        mock_chat.parse_response.return_value = CodeGenerationResult(explanation="質問への回答です", file_changes=[])
        mock_chat_cls.return_value = mock_chat

        mock_executor = MagicMock()
        mock_executor.get_project_context.return_value = "test context"
        mock_executor_cls.return_value = mock_executor

        response = self._client.post(
            "/api/voice/stream",
            json={"text": "これは何ですか"},
        )

        assert response.status_code == 200

        events = self._parse_sse_events(response.text)
        types = [e["type"] for e in events]

        assert "ai_chunk" in types
        assert "ai_done" in types
        assert "commit" not in types
        assert "file_change" not in types
        assert "complete" in types

    def test_given_empty_instruction_when_stream_then_returns_error(self):
        response = self._client.post(
            "/api/voice/stream",
            json={"text": ""},
        )

        assert response.status_code == 200

        events = self._parse_sse_events(response.text)
        error_event = next(e for e in events if e["type"] == "error")
        assert "指示が空です" in error_event["text"]

    @patch("app.voice.router.get_project_root", return_value="/tmp/test")
    @patch("app.voice.router.get_anthropic_api_key", return_value="test-key")
    @patch("app.voice.router.CodeExecutorService")
    @patch("app.voice.router.ChatService")
    def test_given_multi_chunk_stream_when_stream_then_sends_multiple_ai_chunks(
        self, mock_chat_cls, mock_executor_cls, mock_key, mock_root
    ):
        mock_chat = MagicMock()
        mock_chat.stream_generate_code = MagicMock(return_value=fake_stream_chunks("chunk1", "chunk2", "chunk3"))
        mock_chat.parse_response.return_value = CodeGenerationResult(explanation="テスト", file_changes=[])
        mock_chat_cls.return_value = mock_chat

        mock_executor = MagicMock()
        mock_executor.get_project_context.return_value = "test context"
        mock_executor_cls.return_value = mock_executor

        response = self._client.post(
            "/api/voice/stream",
            json={"text": "テスト"},
        )

        assert response.status_code == 200

        events = self._parse_sse_events(response.text)
        ai_chunks = [e for e in events if e["type"] == "ai_chunk"]
        assert len(ai_chunks) == 3
        assert ai_chunks[0]["text"] == "chunk1"
        assert ai_chunks[1]["text"] == "chunk2"
        assert ai_chunks[2]["text"] == "chunk3"

    def _parse_sse_events(self, text: str) -> list[dict]:
        events = []
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                try:
                    events.append(json.loads(line[6:]))
                except json.JSONDecodeError:
                    pass
        return events
