import asyncio
import json
import logging
import os
import shutil
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import ClassVar

logger = logging.getLogger(__name__)

_TOOL_FORMAT: dict[str, tuple[str, str]] = {
    "Write": ("file_path,path", "{name_lower}: {value}"),
    "Edit": ("file_path,path", "{name_lower}: {value}"),
    "MultiEdit": ("file_path,path", "{name_lower}: {value}"),
    "Bash": ("command", "$ {value}"),
    "Read": ("file_path", "read: {value}"),
    "Glob": ("pattern", "glob: {value}"),
    "Grep": ("pattern", "grep: {value}"),
}


def _format_tool_action(name: str, inp: dict) -> str:
    if name in _TOOL_FORMAT:
        keys_str, template = _TOOL_FORMAT[name]
        keys = keys_str.split(",")
        value = next((inp.get(k, "") for k in keys if inp.get(k)), "")
        return template.format(name_lower=name.lower(), value=value)
    return f"tool: {name}"


class ClaudeCodeService:
    _session_ids: ClassVar[dict[str, str]] = {}

    def __init__(self, project_root: str):
        self._project_root = Path(project_root)

    @staticmethod
    def _find_claude_binary() -> str:
        claude_path = shutil.which("claude")
        if claude_path:
            return claude_path
        local_bin = Path.home() / ".local" / "bin" / "claude"
        if local_bin.exists():
            return str(local_bin)
        raise RuntimeError("claude コマンドが見つかりません。Claude Code CLIをインストールしてください。")

    @staticmethod
    def _update_session_id(event: dict, session_key: str) -> None:
        if claude_session_id := event.get("session_id"):
            ClaudeCodeService._session_ids[session_key] = claude_session_id

    async def execute(
        self,
        prompt: str,
        model: str = "claude-opus-4-6",
        session_id: str = "default",
    ) -> AsyncGenerator[dict]:
        claude_bin = self._find_claude_binary()
        cmd = [
            claude_bin,
            "-p",
            prompt,
            "--model",
            model,
            "--output-format",
            "stream-json",
            "--verbose",
            "--dangerously-skip-permissions",
        ]
        claude_session_id = ClaudeCodeService._session_ids.get(session_id)
        if claude_session_id:
            cmd.extend(["--resume", claude_session_id])

        env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}

        logger.info("Claude Code CLI 起動: %s (cwd=%s)", claude_bin, self._project_root)

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(self._project_root),
            env=env,
            limit=1024 * 1024,
        )

        sent_text_length = 0
        seen_tool_ids: set[str] = set()

        async for raw_line in proc.stdout:
            line = raw_line.decode().strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            event_type = event.get("type")

            if event_type == "system":
                self._update_session_id(event, session_id)

            elif event_type == "assistant":
                message = event.get("message", {})
                content_blocks = message.get("content", [])

                full_text = "".join(b.get("text", "") for b in content_blocks if b.get("type") == "text")
                if len(full_text) > sent_text_length:
                    yield {"type": "ai_chunk", "text": full_text[sent_text_length:]}
                    sent_text_length = len(full_text)

                for block in content_blocks:
                    if block.get("type") != "tool_use":
                        continue
                    tool_id = block.get("id", "")
                    if tool_id in seen_tool_ids:
                        continue
                    seen_tool_ids.add(tool_id)

                    name = block.get("name", "")
                    text = _format_tool_action(name, block.get("input", {}))
                    yield {"type": "tool_action", "tool": name, "text": text}

            elif event_type == "result":
                self._update_session_id(event, session_id)
                yield {"type": "ai_done", "explanation": event.get("result", "")}

        await proc.wait()
        if proc.returncode != 0:
            stderr_data = await proc.stderr.read()
            raise RuntimeError(f"Claude Code エラー (code={proc.returncode}): {stderr_data.decode()}")
