import json
import traceback
from collections.abc import AsyncGenerator

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


def _sse(data: dict) -> dict:
    return {"data": json.dumps(data)}


async def _generate_events(
    instruction: str,
    claude_code: ClaudeCodeService,
    git_service: GitService,
    model: str = "claude-opus-4-6",
) -> AsyncGenerator[dict]:
    if not instruction.strip():
        yield _sse({"type": "error", "text": "指示が空です"})
        return

    yield _sse({"type": "status", "text": "Claude Code 実行中..."})

    async for event in claude_code.execute(instruction, model=model):
        yield _sse(event)

    commit_message = git_service.auto_commit(instruction)
    if commit_message:
        yield _sse({"type": "commit", "message": commit_message})

    yield _sse({"type": "complete"})


@router.post("/stream")
async def stream(
    req: StreamRequest,
    claude_code: ClaudeCodeDep,
    git_service: GitServiceDep,
):
    async def event_generator() -> AsyncGenerator[dict]:
        try:
            async for event in _generate_events(req.text, claude_code, git_service, model=req.model):
                yield event
        except Exception as e:
            yield _sse({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})

    return EventSourceResponse(event_generator())
