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


class TestE2eSseStream:
    def test_empty_text_returns_error_event(self):
        events = self._collect_sse_events({"text": ""}, timeout=5)
        types = [e["type"] for e in events]
        assert "error" in types

    def test_stream_returns_ai_response(self):
        events = self._collect_sse_events({"text": "1+1は？"}, timeout=60)
        types = [e["type"] for e in events]

        assert types[0] == "status", f"最初のイベントがstatusではない: {types[0]}"
        assert "ai_chunk" in types or "ai_done" in types, f"AI応答イベントがない: {types}"
        assert types[-1] == "complete", f"最後のイベントがcompleteではない: {types[-1]}"

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
