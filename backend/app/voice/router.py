import json
import traceback
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from pydantic import BaseModel
from sse_starlette import EventSourceResponse

from app.chat.service import ChatService
from app.code_executor.service import CodeExecutorService
from app.dependencies import ChatServiceDep, CodeExecutorDep, GitServiceDep
from app.git.service import GitService

router = APIRouter()


class StreamRequest(BaseModel):
    text: str


def _sse(data: dict) -> dict:
    return {"data": json.dumps(data)}


async def _generate_events(
    instruction: str,
    chat_service: ChatService,
    code_executor: CodeExecutorService,
    git_service: GitService,
) -> AsyncGenerator[dict]:
    if not instruction.strip():
        yield _sse({"type": "error", "text": "指示が空です"})
        return

    yield _sse({"type": "status", "text": "考え中..."})

    project_context = code_executor.get_project_context()

    full_response = ""
    async for chunk in chat_service.stream_generate_code(
        instruction=instruction,
        project_context=project_context,
    ):
        full_response += chunk
        yield _sse({"type": "ai_chunk", "text": chunk})

    result = chat_service.parse_response(full_response)
    yield _sse({"type": "ai_done", "explanation": result.explanation})

    if result.file_changes:
        changes = code_executor.apply_changes(result.file_changes)
        for c in changes:
            yield _sse({"type": "file_change", "path": c["path"], "action": c["action"]})

        yield _sse({"type": "status", "text": "テスト実行中..."})
        test_result = code_executor.run_tests()
        yield _sse({"type": "test_result", **test_result})

        yield _sse({"type": "status", "text": "lint実行中..."})
        lint_result = code_executor.run_lint()
        yield _sse({"type": "lint_result", **lint_result})

        if test_result["success"] and lint_result["success"]:
            commit_message = git_service.auto_commit(instruction)
            if commit_message:
                yield _sse({"type": "commit", "message": commit_message})
        else:
            reasons = []
            if not test_result["success"]:
                reasons.append(f"テスト失敗 (passed:{test_result['passed']}, failed:{test_result['failed']})")
            if not lint_result["success"]:
                reasons.append("lint エラー")
            yield _sse({"type": "verify_failed", "text": "コミットをスキップ: " + ", ".join(reasons)})

    yield _sse({"type": "complete"})


@router.post("/stream")
async def stream(
    req: StreamRequest,
    chat_service: ChatServiceDep,
    code_executor: CodeExecutorDep,
    git_service: GitServiceDep,
):
    async def event_generator() -> AsyncGenerator[dict]:
        try:
            async for event in _generate_events(req.text, chat_service, code_executor, git_service):
                yield event
        except Exception as e:
            yield _sse({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})

    return EventSourceResponse(event_generator())
