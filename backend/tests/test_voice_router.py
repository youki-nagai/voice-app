import base64
import json
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.dependencies import get_chat_repository, get_claude_code_service
from app.main import app
from app.voice.router import _save_image


async def fake_execute(*events):
    for event in events:
        yield event


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


class TestSaveImage:
    def test_given_png_data_url_when_save_then_creates_png_file(self):
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00"
            b"\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00"
            b"\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        encoded = base64.b64encode(png_bytes).decode()
        data_url = f"data:image/png;base64,{encoded}"

        result = _save_image(data_url)

        try:
            assert result.suffix == ".png"
            assert result.exists()
            assert result.read_bytes() == png_bytes
        finally:
            result.unlink(missing_ok=True)

    def test_given_jpeg_data_url_when_save_then_creates_jpg_file(self):
        fake_jpeg = b"\xff\xd8\xff\xe0fake-jpeg-data"
        encoded = base64.b64encode(fake_jpeg).decode()
        data_url = f"data:image/jpeg;base64,{encoded}"

        result = _save_image(data_url)

        try:
            assert result.suffix == ".jpg"
            assert result.read_bytes() == fake_jpeg
        finally:
            result.unlink(missing_ok=True)

    def test_given_svg_data_url_when_save_then_creates_svg_file(self):
        svg_data = b"<svg></svg>"
        encoded = base64.b64encode(svg_data).decode()
        data_url = f"data:image/svg+xml;base64,{encoded}"

        result = _save_image(data_url)

        try:
            assert result.suffix == ".svg"
        finally:
            result.unlink(missing_ok=True)

    def test_given_webp_data_url_when_save_then_creates_webp_file(self):
        fake_webp = b"RIFF\x00\x00\x00\x00WEBP"
        encoded = base64.b64encode(fake_webp).decode()
        data_url = f"data:image/webp;base64,{encoded}"

        result = _save_image(data_url)

        try:
            assert result.suffix == ".webp"
        finally:
            result.unlink(missing_ok=True)


def _make_mock_chat_repo():
    mock_repo = MagicMock()
    mock_thread = MagicMock()
    mock_thread.id = "test-thread-id"
    mock_thread.title = None
    mock_repo.get_or_create_thread = AsyncMock(return_value=mock_thread)
    mock_repo.add_message = AsyncMock()
    mock_repo.update_thread_title = AsyncMock()
    mock_repo.commit = AsyncMock()
    return mock_repo


class TestStreamEndpoint:
    def setup_method(self):
        self._client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def _override(self, mock_claude_code):
        app.dependency_overrides[get_claude_code_service] = lambda: mock_claude_code
        app.dependency_overrides[get_chat_repository] = _make_mock_chat_repo

    def test_given_claude_code_raises_when_stream_then_returns_error_event(self):
        mock_cc = MagicMock()

        async def _raise_execute(prompt, model="claude-opus-4-6"):
            yield {"type": "ai_chunk", "text": "before error"}
            raise RuntimeError("Claude Code crashed")

        mock_cc.execute = MagicMock(side_effect=_raise_execute)
        self._override(mock_cc)

        response = self._client.post("/api/voice/stream", json={"text": "test"})

        assert response.status_code == 200
        events = _parse_sse_events(response.text)
        types = [e["type"] for e in events]
        assert "error" in types

    def test_given_whitespace_only_instruction_when_stream_then_returns_error(self):
        mock_cc = MagicMock()
        self._override(mock_cc)

        response = self._client.post("/api/voice/stream", json={"text": "   "})

        assert response.status_code == 200
        events = _parse_sse_events(response.text)
        error_event = next(e for e in events if e["type"] == "error")
        assert "指示が空です" in error_event["text"]

    def test_given_tool_action_events_when_stream_then_includes_tool_actions(self):
        mock_cc = MagicMock()
        mock_cc.execute = MagicMock(
            return_value=fake_execute(
                {"type": "tool_action", "tool": "Write", "text": "write: test.py"},
                {"type": "ai_done", "explanation": "done"},
            )
        )
        self._override(mock_cc)

        response = self._client.post("/api/voice/stream", json={"text": "test"})

        assert response.status_code == 200
        events = _parse_sse_events(response.text)
        types = [e["type"] for e in events]
        assert "tool_action" in types

    def test_given_model_param_when_stream_then_passes_to_claude_code(self):
        mock_cc = MagicMock()
        mock_cc.execute = MagicMock(
            return_value=fake_execute(
                {"type": "ai_done", "explanation": "done"},
            )
        )
        self._override(mock_cc)

        response = self._client.post(
            "/api/voice/stream",
            json={"text": "test", "model": "claude-sonnet-4-6"},
        )

        assert response.status_code == 200
        call_kwargs = mock_cc.execute.call_args
        assert call_kwargs[1]["model"] == "claude-sonnet-4-6"

    def test_given_image_cleanup_when_stream_completes_then_file_removed(self):
        mock_cc = MagicMock()
        mock_cc.execute = MagicMock(
            return_value=fake_execute(
                {"type": "ai_done", "explanation": "done"},
            )
        )
        self._override(mock_cc)

        png_data = base64.b64encode(
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00"
            b"\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00"
            b"\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        ).decode()
        image_data_url = f"data:image/png;base64,{png_data}"

        response = self._client.post(
            "/api/voice/stream",
            json={"text": "test", "images": [image_data_url]},
        )

        assert response.status_code == 200
        events = _parse_sse_events(response.text)
        types = [e["type"] for e in events]
        assert "complete" in types
