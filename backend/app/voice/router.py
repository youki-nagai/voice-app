import asyncio
import base64
import json
import logging
import tempfile
import traceback
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette import EventSourceResponse

from app.chat.repository import ChatRepository
from app.claude_code.service import ClaudeCodeService
from app.dependencies import ChatRepoDep, ClaudeCodeDep

logger = logging.getLogger(__name__)

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
    chat_repo: ChatRepository,
    model: str = "claude-opus-4-6",
    image_paths: list[Path] | None = None,
    session_id: str = "default",
    images_raw: list[str] | None = None,
) -> AsyncGenerator[dict]:
    if not instruction.strip():
        yield _sse({"type": "error", "text": "指示が空です"})
        return

    thread = await chat_repo.get_or_create_thread(session_id)
    await chat_repo.add_message(
        thread_id=thread.id,
        role="user",
        text=instruction,
        model=model,
        images=images_raw if images_raw else None,
    )
    if not thread.title:
        await chat_repo.update_thread_title(thread.id, instruction[:100])
    await chat_repo.commit()

    yield _sse({"type": "status", "text": "Claude Code 実行中..."})

    prompt = instruction
    if image_paths:
        paths_str = " ".join(str(p) for p in image_paths)
        prompt = f"{instruction}\n\n添付画像: {paths_str}"

    ai_text_parts: list[str] = []
    tool_actions: list[dict] = []

    try:
        event_queue: asyncio.Queue[dict | None] = asyncio.Queue()
        task_error: list[Exception] = []

        async def _collect_events() -> None:
            try:
                async for event in claude_code.execute(prompt, model=model, session_id=session_id):
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

                if event.get("type") == "ai_chunk":
                    ai_text_parts.append(event["text"])
                elif event.get("type") == "tool_action":
                    tool_actions.append({"tool": event["tool"], "text": event["text"]})

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

        ai_full_text = "".join(ai_text_parts)
        if ai_full_text or tool_actions:
            try:
                await chat_repo.add_message(
                    thread_id=thread.id,
                    role="ai",
                    text=ai_full_text,
                    model=model,
                    tool_actions=tool_actions if tool_actions else None,
                )
                await chat_repo.commit()
            except Exception:
                logger.exception("AI メッセージの DB 保存に失敗")

        yield _sse({"type": "complete"})
    finally:
        for p in image_paths or []:
            p.unlink(missing_ok=True)


@router.post("/stream")
async def stream(
    req: StreamRequest,
    claude_code: ClaudeCodeDep,
    chat_repo: ChatRepoDep,
):
    image_paths = [_save_image(img) for img in req.images] or None

    async def event_generator() -> AsyncGenerator[dict]:
        try:
            async for event in _generate_events(
                req.text,
                claude_code,
                chat_repo,
                model=req.model,
                image_paths=image_paths,
                session_id=req.session_id,
                images_raw=req.images if req.images else None,
            ):
                yield event
        except Exception as e:
            yield _sse({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})

    return EventSourceResponse(event_generator())
