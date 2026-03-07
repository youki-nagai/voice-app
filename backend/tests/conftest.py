import json
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.dependencies import get_chat_repository, get_claude_code_service, get_voice_command_classifier
from app.main import app
from app.voice.classifier import ClassifyResult


async def fake_execute(*events):
    for event in events:
        yield event


def parse_sse_events(text: str) -> list[dict]:
    events = []
    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("data: "):
            try:
                events.append(json.loads(line[6:]))
            except json.JSONDecodeError:
                pass
    return events


def make_mock_chat_repo():
    mock_repo = MagicMock()
    mock_thread = MagicMock()
    mock_thread.id = "test-thread-id"
    mock_thread.title = None
    mock_repo.get_or_create_thread = AsyncMock(return_value=mock_thread)
    mock_repo.add_message = AsyncMock()
    mock_repo.update_thread_title = AsyncMock()
    mock_repo.commit = AsyncMock()
    return mock_repo


class StreamTestBase:
    """SSE ストリームテストの共通基盤。"""

    def setup_method(self):
        self._client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def _override(self, mock_claude_code, mock_classifier=None):
        app.dependency_overrides[get_claude_code_service] = lambda: mock_claude_code
        app.dependency_overrides[get_chat_repository] = make_mock_chat_repo
        if mock_classifier is None:
            mock_classifier = MagicMock()
            mock_classifier.classify = AsyncMock(return_value=ClassifyResult(is_command=False))
        app.dependency_overrides[get_voice_command_classifier] = lambda: mock_classifier
