import json
import logging
import traceback
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette import EventSourceResponse

from app.chat.repository import ChatRepository
from app.claude_code.service import ClaudeCodeService
from app.dependencies import ChatRepoDep, ClaudeCodeDep
from app.voice.image import build_prompt, save_image
from app.voice.sse import sse_event, stream_with_keepalive

logger = logging.getLogger(__name__)

router = APIRouter()


class StreamRequest(BaseModel):
    text: str
    model: str = "claude-opus-4-6"
    images: list[str] = []
    session_id: str = "default"


async def _generate_events(
    instruction: str,
    claude_code: ClaudeCodeService,
    chat_repo: ChatRepository,
    req: StreamRequest,
) -> AsyncGenerator[dict]:
    if not instruction.strip():
        yield sse_event({"type": "error", "text": "指示が空です"})
        return

    image_paths = [save_image(img) for img in req.images] or None

    thread = await chat_repo.get_or_create_thread(req.session_id)
    await chat_repo.add_message(
        thread_id=thread.id,
        role="user",
        text=instruction,
        model=req.model,
        images=req.images if req.images else None,
    )
    if not thread.title:
        await chat_repo.update_thread_title(thread.id, instruction[:100])
    await chat_repo.commit()

    yield sse_event({"type": "status", "text": "Claude Code 実行中..."})

    prompt = build_prompt(instruction, image_paths)

    ai_text_parts: list[str] = []
    tool_actions: list[dict] = []

    try:
        async for event in stream_with_keepalive(
            claude_code.execute(prompt, model=req.model, session_id=req.session_id),
        ):
            data = json.loads(event["data"])
            if data.get("type") == "ai_chunk":
                ai_text_parts.append(data["text"])
            elif data.get("type") == "tool_action":
                tool_actions.append({"tool": data["tool"], "text": data["text"]})
            yield event

        ai_full_text = "".join(ai_text_parts)
        if ai_full_text or tool_actions:
            try:
                await chat_repo.add_message(
                    thread_id=thread.id,
                    role="ai",
                    text=ai_full_text,
                    model=req.model,
                    tool_actions=tool_actions if tool_actions else None,
                )
                await chat_repo.commit()
            except Exception:
                logger.exception("AI メッセージの DB 保存に失敗")

        yield sse_event({"type": "complete"})
    finally:
        for p in image_paths or []:
            p.unlink(missing_ok=True)


@router.post("/stream")
async def stream(
    req: StreamRequest,
    claude_code: ClaudeCodeDep,
    chat_repo: ChatRepoDep,
):
    async def event_generator() -> AsyncGenerator[dict]:
        try:
            async for event in _generate_events(
                req.text,
                claude_code,
                chat_repo,
                req,
            ):
                yield event
        except Exception as e:
            yield sse_event({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})

    return EventSourceResponse(event_generator())


@router.get("/threads")
async def list_threads(chat_repo: ChatRepoDep):
    threads = await chat_repo.list_threads()
    return [
        {
            "session_id": t.session_id,
            "title": t.title,
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat(),
        }
        for t in threads
    ]


@router.get("/threads/{session_id}/messages")
async def get_thread_messages(session_id: str, chat_repo: ChatRepoDep):
    messages = await chat_repo.get_thread_messages(session_id)
    return [
        {
            "role": m.role,
            "text": m.text,
            "model": m.model,
            "images": m.images,
            "tool_actions": m.tool_actions,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]
