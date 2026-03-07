import asyncio
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
from app.dependencies import ClaudeCodeDep

KEEPALIVE_INTERVAL_SECONDS = 15

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
        event_queue: asyncio.Queue[dict | None] = asyncio.Queue()
        task_error: list[Exception] = []

        async def _collect_events() -> None:
            try:
                async for event in claude_code.execute(prompt, model=model):
                    await event_queue.put(event)
            except Exception as e:
                task_error.append(e)
            finally:
                await event_queue.put(None)

        task = asyncio.create_task(_collect_events())

        try:
            while True:
                try:
                    event = await asyncio.wait_for(event_queue.get(), timeout=KEEPALIVE_INTERVAL_SECONDS)
                except TimeoutError:
                    yield _sse({"type": "keepalive"})
                    continue

                if event is None:
                    break
                yield _sse(event)

            if task_error:
                raise task_error[0]
        finally:
            if not task.done():
                task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass

        yield _sse({"type": "complete"})
    finally:
        if image_path:
            image_path.unlink(missing_ok=True)


@router.post("/stream")
async def stream(
    req: StreamRequest,
    claude_code: ClaudeCodeDep,
):
    image_path = _save_image(req.image) if req.image else None

    async def event_generator() -> AsyncGenerator[dict]:
        try:
            async for event in _generate_events(req.text, claude_code, model=req.model, image_path=image_path):
                yield event
        except Exception as e:
            yield _sse({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})

    return EventSourceResponse(event_generator())
