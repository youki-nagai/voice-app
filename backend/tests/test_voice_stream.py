import json
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.chat.schemas import CodeGenerationResult, FileChange
from app.dependencies import get_chat_service, get_code_executor_service, get_git_service
from app.main import app


async def fake_stream_chunks(*chunks):
    for chunk in chunks:
        yield chunk


def _make_mocks(file_changes=None, full_response="", commit_msg=None):
    mock_chat = MagicMock()
    mock_chat.stream_generate_code = MagicMock(return_value=fake_stream_chunks(full_response))
    mock_chat.parse_response.return_value = CodeGenerationResult(
        explanation="テスト",
        file_changes=file_changes or [],
    )

    mock_executor = MagicMock()
    mock_executor.get_project_context.return_value = "test context"
    if file_changes:
        mock_executor.apply_changes.return_value = [{"path": fc.path, "action": f"{fc.action}d"} for fc in file_changes]
        mock_executor.run_tests.return_value = {"success": True, "passed": 1, "failed": 0, "output": ""}
        mock_executor.run_lint.return_value = {"success": True, "output": ""}

    mock_git = MagicMock()
    mock_git.auto_commit.return_value = commit_msg

    return mock_chat, mock_executor, mock_git


def _parse_sse_events(text: str) -> list[dict]:
    events = []
    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("data: "):
            try:
                events.append(json.loads(line[6:]))
            except json.JSONDecodeError:
                pass
    return events


class TestVoiceStream:
    def setup_method(self):
        self._client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def _override(self, mock_chat, mock_executor, mock_git):
        app.dependency_overrides[get_chat_service] = lambda: mock_chat
        app.dependency_overrides[get_code_executor_service] = lambda: mock_executor
        app.dependency_overrides[get_git_service] = lambda: mock_git

    def test_given_valid_instruction_when_stream_then_returns_sse_events(self):
        full_response = (
            '{"explanation": "テストファイルを作成しました", '
            '"file_changes": [{"path": "test.py", "content": "print(1)", "action": "create"}]}'
        )
        mock_chat, mock_executor, mock_git = _make_mocks(
            file_changes=[FileChange(path="test.py", content="print(1)", action="create")],
            full_response=full_response,
            commit_msg="voice: テスト",
        )
        mock_chat.parse_response.return_value = CodeGenerationResult(
            explanation="テストファイルを作成しました",
            file_changes=[FileChange(path="test.py", content="print(1)", action="create")],
        )
        self._override(mock_chat, mock_executor, mock_git)

        response = self._client.post("/api/voice/stream", json={"text": "テストファイルを作成して"})

        assert response.status_code == 200
        types = [e["type"] for e in _parse_sse_events(response.text)]
        assert "status" in types
        assert "ai_chunk" in types
        assert "ai_done" in types
        assert "file_change" in types
        assert "test_result" in types
        assert "lint_result" in types
        assert "commit" in types
        assert "complete" in types

    def test_given_no_file_changes_when_stream_then_skips_commit(self):
        mock_chat, mock_executor, mock_git = _make_mocks(full_response="質問への回答です")
        mock_chat.parse_response.return_value = CodeGenerationResult(explanation="質問への回答です", file_changes=[])
        self._override(mock_chat, mock_executor, mock_git)

        response = self._client.post("/api/voice/stream", json={"text": "これは何ですか"})

        assert response.status_code == 200
        types = [e["type"] for e in _parse_sse_events(response.text)]
        assert "ai_chunk" in types
        assert "ai_done" in types
        assert "commit" not in types
        assert "file_change" not in types
        assert "complete" in types

    def test_given_empty_instruction_when_stream_then_returns_error(self):
        mock_chat, mock_executor, mock_git = _make_mocks()
        self._override(mock_chat, mock_executor, mock_git)

        response = self._client.post("/api/voice/stream", json={"text": ""})

        assert response.status_code == 200
        events = _parse_sse_events(response.text)
        error_event = next(e for e in events if e["type"] == "error")
        assert "指示が空です" in error_event["text"]

    def test_given_multi_chunk_stream_when_stream_then_sends_multiple_ai_chunks(self):
        mock_chat = MagicMock()
        mock_chat.stream_generate_code = MagicMock(return_value=fake_stream_chunks("chunk1", "chunk2", "chunk3"))
        mock_chat.parse_response.return_value = CodeGenerationResult(explanation="テスト", file_changes=[])

        mock_executor = MagicMock()
        mock_executor.get_project_context.return_value = "test context"

        mock_git = MagicMock()
        self._override(mock_chat, mock_executor, mock_git)

        response = self._client.post("/api/voice/stream", json={"text": "テスト"})

        assert response.status_code == 200
        ai_chunks = [e for e in _parse_sse_events(response.text) if e["type"] == "ai_chunk"]
        assert len(ai_chunks) == 3
        assert ai_chunks[0]["text"] == "chunk1"
        assert ai_chunks[1]["text"] == "chunk2"
        assert ai_chunks[2]["text"] == "chunk3"

    def test_given_test_failure_when_stream_then_skips_commit(self):
        mock_chat, mock_executor, mock_git = _make_mocks(
            file_changes=[FileChange(path="bad.py", content="x", action="create")],
            full_response='{"explanation":"x","file_changes":[{"path":"bad.py","content":"x","action":"create"}]}',
        )
        mock_executor.run_tests.return_value = {"success": False, "passed": 0, "failed": 1, "output": "FAILED"}
        self._override(mock_chat, mock_executor, mock_git)

        response = self._client.post("/api/voice/stream", json={"text": "bad.pyを作成して"})

        types = [e["type"] for e in _parse_sse_events(response.text)]
        assert "verify_failed" in types
        assert "commit" not in types
