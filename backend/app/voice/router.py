import base64
import json
import tempfile
import traceback
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette import EventSourceResponse

from app.claude_code.service import ClaudeCodeService
from app.dependencies import ClaudeCodeDep, GitServiceDep
from app.git.service import GitService

router = APIRouter()


class StreamRequest(BaseModel):
    text: str
    model: str = "claude-opus-4-6"
    image: str | None = None


def _sse(data: dict) -> dict:
    return {"data": json.dumps(data)}


def _save_image(image_data_url: str) -> Path:
    """data:image/xxx;base64,... 形式の画像を一時ファイルに保存してパスを返す。"""
    header, encoded = image_data_url.split(",", 1)
    # data:image/png;base64 → png
    mime = header.split(";")[0].split("/")[1]
    ext = {"jpeg": "jpg", "svg+xml": "svg"}.get(mime, mime)
    tmp = tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False)
    tmp.write(base64.b64decode(encoded))
    tmp.close()
    return Path(tmp.name)


async def _generate_events(
    instruction: str,
    claude_code: ClaudeCodeService,
    git_service: GitService,
    model: str = "claude-opus-4-6",
    image_path: Path | None = None,
) -> AsyncGenerator[dict]:
    if not instruction.strip():
        yield _sse({"type": "error", "text": "指示が空です"})
        return

    yield _sse({"type": "status", "text": "Claude Code 実行中..."})

    prompt = instruction
    if image_path:
        prompt = f"{instruction}\n\n添付画像: {image_path}"

    try:
        async for event in claude_code.execute(prompt, model=model):
            yield _sse(event)

        commit_message = git_service.auto_commit(instruction)
        if commit_message:
            yield _sse({"type": "commit", "message": commit_message})

        yield _sse({"type": "complete"})
    finally:
        if image_path:
            image_path.unlink(missing_ok=True)


@router.post("/stream")
async def stream(
    req: StreamRequest,
    claude_code: ClaudeCodeDep,
    git_service: GitServiceDep,
):
    image_path = _save_image(req.image) if req.image else None

    async def event_generator() -> AsyncGenerator[dict]:
        try:
            async for event in _generate_events(
                req.text, claude_code, git_service, model=req.model, image_path=image_path
            ):
                yield event
        except Exception as e:
            yield _sse({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})

    return EventSourceResponse(event_generator())
