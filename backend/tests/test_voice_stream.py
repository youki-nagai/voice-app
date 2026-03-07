import base64
import json
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.dependencies import get_claude_code_service
from app.main import app


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


class TestVoiceStream:
    def setup_method(self):
        self._client = TestClient(app)

    def teardown_method(self):
        app.dependency_overrides.clear()

    def _override(self, mock_claude_code):
        app.dependency_overrides[get_claude_code_service] = lambda: mock_claude_code

    def test_given_valid_instruction_when_stream_then_returns_sse_events(self):
        mock_cc = MagicMock()
        mock_cc.execute = MagicMock(
            return_value=fake_execute(
                {"type": "ai_chunk", "text": "テストファイルを作成します"},
                {"type": "file_change", "path": "test.py", "action": "write"},
                {"type": "ai_done", "explanation": "完了"},
            )
        )
        self._override(mock_cc)

        response = self._client.post("/api/voice/stream", json={"text": "テストファイルを作成して"})

        assert response.status_code == 200
        types = [e["type"] for e in _parse_sse_events(response.text)]
        assert "status" in types
        assert "ai_chunk" in types
        assert "file_change" in types
        assert "ai_done" in types
        assert "complete" in types

    def test_given_no_file_changes_when_stream_then_completes_without_commit(self):
        mock_cc = MagicMock()
        mock_cc.execute = MagicMock(
            return_value=fake_execute(
                {"type": "ai_chunk", "text": "質問への回答です"},
                {"type": "ai_done", "explanation": "回答完了"},
            )
        )
        self._override(mock_cc)

        response = self._client.post("/api/voice/stream", json={"text": "これは何ですか"})

        assert response.status_code == 200
        types = [e["type"] for e in _parse_sse_events(response.text)]
        assert "ai_chunk" in types
        assert "ai_done" in types
        assert "complete" in types

    def test_given_empty_instruction_when_stream_then_returns_error(self):
        mock_cc = MagicMock()
        self._override(mock_cc)

        response = self._client.post("/api/voice/stream", json={"text": ""})

        assert response.status_code == 200
        events = _parse_sse_events(response.text)
        error_event = next(e for e in events if e["type"] == "error")
        assert "指示が空です" in error_event["text"]

    def test_given_multi_chunk_stream_when_stream_then_sends_multiple_ai_chunks(self):
        mock_cc = MagicMock()
        mock_cc.execute = MagicMock(
            return_value=fake_execute(
                {"type": "ai_chunk", "text": "chunk1"},
                {"type": "ai_chunk", "text": "chunk2"},
                {"type": "ai_chunk", "text": "chunk3"},
                {"type": "ai_done", "explanation": ""},
            )
        )
        self._override(mock_cc)

        response = self._client.post("/api/voice/stream", json={"text": "テスト"})

        assert response.status_code == 200
        ai_chunks = [e for e in _parse_sse_events(response.text) if e["type"] == "ai_chunk"]
        assert len(ai_chunks) == 3
        assert ai_chunks[0]["text"] == "chunk1"
        assert ai_chunks[1]["text"] == "chunk2"
        assert ai_chunks[2]["text"] == "chunk3"

    def test_given_image_when_stream_then_passes_image_path_to_claude(self):
        mock_cc = MagicMock()
        mock_cc.execute = MagicMock(
            return_value=fake_execute(
                {"type": "ai_chunk", "text": "画像を確認しました"},
                {"type": "ai_done", "explanation": "完了"},
            )
        )
        self._override(mock_cc)

        # 1x1 赤ピクセルのPNG
        png_data = base64.b64encode(
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00"
            b"\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00"
            b"\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
        ).decode()
        image_data_url = f"data:image/png;base64,{png_data}"

        response = self._client.post(
            "/api/voice/stream",
            json={"text": "この画像を見て", "image": image_data_url},
        )

        assert response.status_code == 200
        types = [e["type"] for e in _parse_sse_events(response.text)]
        assert "ai_chunk" in types
        assert "complete" in types
        # プロンプトに画像パスが含まれていること
        call_args = mock_cc.execute.call_args
        assert "添付画像:" in call_args[0][0]
