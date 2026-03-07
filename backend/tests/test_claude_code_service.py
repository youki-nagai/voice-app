import json
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.claude_code.service import ClaudeCodeService


class TestFindClaudeBinary:
    @patch("shutil.which", return_value="/usr/local/bin/claude")
    def test_given_claude_in_path_when_find_then_returns_path(self, _mock_which):
        result = ClaudeCodeService._find_claude_binary()
        assert result == "/usr/local/bin/claude"

    @patch("shutil.which", return_value=None)
    @patch.object(Path, "exists", return_value=True)
    def test_given_claude_in_local_bin_when_find_then_returns_local_path(self, _mock_exists, _mock_which):
        result = ClaudeCodeService._find_claude_binary()
        assert ".local/bin/claude" in result

    @patch("shutil.which", return_value=None)
    @patch.object(Path, "exists", return_value=False)
    def test_given_claude_not_found_when_find_then_raises(self, _mock_exists, _mock_which):
        with pytest.raises(RuntimeError, match="claude コマンドが見つかりません"):
            ClaudeCodeService._find_claude_binary()


class TestClaudeCodeExecute:
    def setup_method(self):
        self._service = ClaudeCodeService(project_root="/tmp/test")
        ClaudeCodeService._session_ids = {}

    def _make_proc(self, stdout_lines: list[str], returncode: int = 0):
        proc = AsyncMock()
        proc.returncode = returncode

        async def _iter_lines():
            for line in stdout_lines:
                yield (line + "\n").encode()

        proc.stdout = _iter_lines()
        proc.stderr = AsyncMock()
        proc.stderr.read = AsyncMock(return_value=b"")
        proc.wait = AsyncMock()
        return proc

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_system_event_when_execute_then_stores_session_id(self, mock_exec, _mock_bin):
        proc = self._make_proc([json.dumps({"type": "system", "session_id": "sess-123"})])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert ClaudeCodeService._session_ids["default"] == "sess-123"
        assert events == []

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_assistant_text_event_when_execute_then_yields_ai_chunk(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {"content": [{"type": "text", "text": "Hello world"}]},
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert len(events) == 1
        assert events[0]["type"] == "ai_chunk"
        assert events[0]["text"] == "Hello world"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_assistant_tool_use_when_execute_then_yields_tool_action(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-1",
                        "name": "Write",
                        "input": {"file_path": "/tmp/test.py"},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert len(events) == 1
        assert events[0]["type"] == "tool_action"
        assert events[0]["tool"] == "Write"
        assert "test.py" in events[0]["text"]

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_bash_tool_use_when_execute_then_yields_command(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-2",
                        "name": "Bash",
                        "input": {"command": "ls -la"},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert events[0]["text"] == "$ ls -la"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_read_tool_use_when_execute_then_yields_read_action(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-3",
                        "name": "Read",
                        "input": {"file_path": "/tmp/foo.py"},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert events[0]["text"] == "read: /tmp/foo.py"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_glob_tool_use_when_execute_then_yields_glob_action(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-4",
                        "name": "Glob",
                        "input": {"pattern": "**/*.py"},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert events[0]["text"] == "glob: **/*.py"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_grep_tool_use_when_execute_then_yields_grep_action(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-5",
                        "name": "Grep",
                        "input": {"pattern": "TODO"},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert events[0]["text"] == "grep: TODO"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_unknown_tool_when_execute_then_yields_generic_action(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-6",
                        "name": "CustomTool",
                        "input": {},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert events[0]["text"] == "tool: CustomTool"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_duplicate_tool_id_when_execute_then_skips_duplicate(self, mock_exec, _mock_bin):
        tool_block = {"type": "tool_use", "id": "tool-dup", "name": "Bash", "input": {"command": "echo hi"}}
        event1 = {"type": "assistant", "message": {"content": [tool_block]}}
        event2 = {"type": "assistant", "message": {"content": [tool_block]}}
        proc = self._make_proc([json.dumps(event1), json.dumps(event2)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        tool_actions = [e for e in events if e["type"] == "tool_action"]
        assert len(tool_actions) == 1

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_result_event_when_execute_then_yields_ai_done(self, mock_exec, _mock_bin):
        result_event = {"type": "result", "result": "All done", "session_id": "sess-456"}
        proc = self._make_proc([json.dumps(result_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert len(events) == 1
        assert events[0]["type"] == "ai_done"
        assert events[0]["explanation"] == "All done"
        assert ClaudeCodeService._session_ids["default"] == "sess-456"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_nonzero_exit_when_execute_then_raises(self, mock_exec, _mock_bin):
        proc = self._make_proc([], returncode=1)
        proc.stderr.read = AsyncMock(return_value=b"something went wrong")
        mock_exec.return_value = proc

        with pytest.raises(RuntimeError, match="Claude Code エラー"):
            async for _ in self._service.execute("test"):
                pass

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_invalid_json_line_when_execute_then_skips(self, mock_exec, _mock_bin):
        proc = self._make_proc(["not-json", json.dumps({"type": "result", "result": "ok"})])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert len(events) == 1
        assert events[0]["type"] == "ai_done"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_empty_line_when_execute_then_skips(self, mock_exec, _mock_bin):
        proc = self._make_proc(["", json.dumps({"type": "result", "result": "ok"})])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert len(events) == 1

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_existing_session_when_execute_then_resumes(self, mock_exec, _mock_bin):
        ClaudeCodeService._session_ids["default"] = "existing-session"
        proc = self._make_proc([json.dumps({"type": "result", "result": "ok"})])
        mock_exec.return_value = proc

        async for _ in self._service.execute("test"):
            pass

        call_args = mock_exec.call_args[0]
        assert "--resume" in call_args
        assert "existing-session" in call_args

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_model_param_when_execute_then_passes_model(self, mock_exec, _mock_bin):
        proc = self._make_proc([json.dumps({"type": "result", "result": "ok"})])
        mock_exec.return_value = proc

        async for _ in self._service.execute("test", model="claude-sonnet-4-6"):
            pass

        call_args = mock_exec.call_args[0]
        model_idx = list(call_args).index("--model")
        assert call_args[model_idx + 1] == "claude-sonnet-4-6"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_incremental_text_when_execute_then_yields_delta_only(self, mock_exec, _mock_bin):
        event1 = {"type": "assistant", "message": {"content": [{"type": "text", "text": "Hello"}]}}
        event2 = {"type": "assistant", "message": {"content": [{"type": "text", "text": "Hello world"}]}}
        proc = self._make_proc([json.dumps(event1), json.dumps(event2)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        chunks = [e for e in events if e["type"] == "ai_chunk"]
        assert len(chunks) == 2
        assert chunks[0]["text"] == "Hello"
        assert chunks[1]["text"] == " world"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_edit_tool_when_execute_then_yields_edit_action(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-edit",
                        "name": "Edit",
                        "input": {"file_path": "/tmp/edit.py"},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert events[0]["text"] == "edit: /tmp/edit.py"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_multiedit_tool_when_execute_then_yields_multiedit_action(self, mock_exec, _mock_bin):
        assistant_event = {
            "type": "assistant",
            "message": {
                "content": [
                    {
                        "type": "tool_use",
                        "id": "tool-me",
                        "name": "MultiEdit",
                        "input": {"path": "/tmp/multi.py"},
                    }
                ]
            },
        }
        proc = self._make_proc([json.dumps(assistant_event)])
        mock_exec.return_value = proc

        events = [e async for e in self._service.execute("test")]

        assert events[0]["text"] == "multiedit: /tmp/multi.py"

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_custom_session_id_when_execute_then_stores_per_session(self, mock_exec, _mock_bin):
        proc = self._make_proc([json.dumps({"type": "system", "session_id": "sess-a"})])
        mock_exec.return_value = proc

        async for _ in self._service.execute("test", session_id="chat-1"):
            pass

        assert ClaudeCodeService._session_ids["chat-1"] == "sess-a"
        assert "default" not in ClaudeCodeService._session_ids

    @patch.object(ClaudeCodeService, "_find_claude_binary", return_value="/usr/local/bin/claude")
    @patch("asyncio.create_subprocess_exec")
    async def test_given_existing_session_for_key_when_execute_then_resumes_correct_session(self, mock_exec, _mock_bin):
        ClaudeCodeService._session_ids["chat-2"] = "sess-b"
        proc = self._make_proc([json.dumps({"type": "result", "result": "ok"})])
        mock_exec.return_value = proc

        async for _ in self._service.execute("test", session_id="chat-2"):
            pass

        call_args = mock_exec.call_args[0]
        assert "--resume" in call_args
        assert "sess-b" in call_args
