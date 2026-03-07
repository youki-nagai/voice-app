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
    images: list[str] = []
    session_id: str = "default"


def _sse(data: dict) -> dict:
    return {"data": json.dumps(data)}


def _save_image(image_data_url: str) -> Path:
    """data:image/xxx;base64,... 形式の画像を一時ファイルに保存してパスを返す。"""
    header, encoded = image_data_url.split(",", 1)
    mime = header.split(";")[0].split("/")[1]
    ext = {"jpeg": "jpg", "svg+xml": "svg"}.get(mime, mime)
    tmp = tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False)
    tmp.write(base64.b64decode(encoded))
    tmp.close()
    return Path(tmp.name)


def _build_prompt(instruction: str, image_paths: list[Path] | None) -> str:
    if not image_paths:
        return instruction
    paths_str = " ".join(str(p) for p in image_paths)
    return f"{instruction}\n\n添付画像: {paths_str}"


async def _stream_with_keepalive(
    source: AsyncGenerator[dict],
    interval: float = KEEPALIVE_INTERVAL_SECONDS,
) -> AsyncGenerator[dict]:
    """ソースジェネレータのイベントを中継し、無通信時に keepalive を送る。"""
    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    task_error: list[Exception] = []

    async def collect() -> None:
        try:
            async for event in source:
                await queue.put(event)
        except Exception as e:
            task_error.append(e)
        finally:
            await queue.put(None)

    task = asyncio.create_task(collect())
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=interval)
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


async def _generate_events(
    instruction: str,
    claude_code: ClaudeCodeService,
    model: str = "claude-opus-4-6",
    image_paths: list[Path] | None = None,
    session_id: str = "default",
) -> AsyncGenerator[dict]:
    if not instruction.strip():
        yield _sse({"type": "error", "text": "指示が空です"})
        return

    yield _sse({"type": "status", "text": "Claude Code 実行中..."})

    prompt = _build_prompt(instruction, image_paths)

    try:
        async for event in _stream_with_keepalive(
            claude_code.execute(prompt, model=model, session_id=session_id),
        ):
            yield event
        yield _sse({"type": "complete"})
    finally:
        for p in image_paths or []:
            p.unlink(missing_ok=True)


@router.post("/stream")
async def stream(
    req: StreamRequest,
    claude_code: ClaudeCodeDep,
):
    image_paths = [_save_image(img) for img in req.images] or None

    async def event_generator() -> AsyncGenerator[dict]:
        try:
            async for event in _generate_events(
                req.text,
                claude_code,
                model=req.model,
                image_paths=image_paths,
                session_id=req.session_id,
            ):
                yield event
        except Exception as e:
            yield _sse({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})

    return EventSourceResponse(event_generator())
