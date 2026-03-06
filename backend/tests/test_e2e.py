"""
E2Eテスト: 実際に稼働中のサーバー(localhost:8000)に対してテスト。
`make verify` で実行。サーバーが起動していない場合はスキップされる。
"""

import json

import httpx
import pytest

BASE_URL = "http://localhost:8000"


def server_is_running():
    try:
        r = httpx.get(BASE_URL, timeout=2)
        return r.status_code == 200
    except httpx.ConnectError:
        return False


pytestmark = pytest.mark.skipif(not server_is_running(), reason="サーバーが起動していません")


class TestE2eFrontend:
    def test_frontend_loads(self):
        r = httpx.get(BASE_URL, timeout=5)
        assert r.status_code == 200
        assert "voice-app" in r.text


class TestE2eGitEndpoints:
    def test_git_check(self):
        r = httpx.get(f"{BASE_URL}/api/git/check", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "gh_status" in data
        assert "repo_info" in data

    def test_git_status(self):
        r = httpx.get(f"{BASE_URL}/api/git/status", timeout=5)
        assert r.status_code == 200
        data = r.json()
        assert "branch" in data
        assert "changed_files" in data

    def test_git_log(self):
        r = httpx.get(f"{BASE_URL}/api/git/log", timeout=5)
        assert r.status_code == 200
        data = r.json()
        assert "log" in data
        assert len(data["log"]) > 0

    def test_git_branch_empty_name_rejected(self):
        r = httpx.post(f"{BASE_URL}/api/git/branch", json={"name": ""}, timeout=5)
        assert r.status_code == 200
        assert r.json()["success"] is False

    def test_git_pr_empty_title_rejected(self):
        r = httpx.post(f"{BASE_URL}/api/git/pr", json={"title": "", "body": ""}, timeout=5)
        assert r.status_code == 200
        assert r.json()["success"] is False


class TestE2eChatHistory:
    def test_chat_history_endpoint(self):
        r = httpx.get(f"{BASE_URL}/api/chat/history", timeout=5)
        assert r.status_code == 200
        data = r.json()
        assert "history" in data


class TestE2eSseStream:
    def test_empty_text_returns_error_event(self):
        events = self._collect_sse_events({"text": ""}, timeout=5)
        types = [e["type"] for e in events]
        assert "error" in types

    def test_stream_returns_ai_chunks(self):
        events = self._collect_sse_events({"text": "1+1は？"}, timeout=30)
        types = [e["type"] for e in events]

        assert "status" in types, f"statusイベントがない: {types}"
        assert "ai_chunk" in types, f"ai_chunkイベントがない: {types}"
        assert "ai_done" in types, f"ai_doneイベントがない: {types}"
        assert "complete" in types, f"completeイベントがない: {types}"

        # ai_chunkが1回以上来ている（短い回答は1チャンクの場合あり）
        chunk_count = types.count("ai_chunk")
        assert chunk_count >= 1, f"ai_chunkが{chunk_count}回しかない"

        # ai_chunkのテキストを結合して内容確認
        full_text = "".join(e["text"] for e in events if e["type"] == "ai_chunk")
        assert len(full_text) > 0, "ai_chunkのテキストが空"

    def test_stream_event_order(self):
        events = self._collect_sse_events({"text": "hello"}, timeout=30)
        types = [e["type"] for e in events]

        # statusが最初、completeが最後
        assert types[0] == "status", f"最初のイベントがstatusではない: {types[0]}"
        assert types[-1] == "complete", f"最後のイベントがcompleteではない: {types[-1]}"

    def test_code_change_request_returns_file_change_events(self):
        events = self._collect_sse_events(
            {"text": "backend/tests/tmp_e2e_test.txt を作成して。内容は hello e2e"},
            timeout=60,
        )
        types = [e["type"] for e in events]

        assert "ai_chunk" in types, f"ai_chunkがない: {types}"
        assert "ai_done" in types, f"ai_doneがない: {types}"

        has_file_change = "file_change" in types
        if has_file_change:
            fc = next(e for e in events if e["type"] == "file_change")
            assert "tmp_e2e_test.txt" in fc["path"]

            import os

            created_path = os.path.join(os.path.dirname(__file__), "..", fc["path"])
            if os.path.exists(created_path):
                os.remove(created_path)
        else:
            full_text = "".join(e["text"] for e in events if e["type"] == "ai_chunk")
            pytest.fail(f"file_changeイベントが返されなかった。AI応答: {full_text[:500]}")

    def _collect_sse_events(self, body, timeout=30):
        events = []
        with httpx.stream(
            "POST",
            f"{BASE_URL}/api/voice/stream",
            json=body,
            headers={"Accept": "text/event-stream"},
            timeout=timeout,
        ) as response:
            assert response.status_code == 200
            for line in response.iter_lines():
                if line.startswith("data: "):
                    try:
                        events.append(json.loads(line[6:]))
                    except json.JSONDecodeError:
                        pass
        return events
