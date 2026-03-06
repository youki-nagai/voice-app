import json
import traceback
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Request
from sse_starlette import EventSourceResponse

from app.chat.service import ChatService
from app.code_executor.service import CodeExecutorService
from app.config import get_anthropic_api_key, get_project_root

router = APIRouter()


@router.post("/stream")
async def stream(request: Request):
    """SSEストリームでAI応答をリアルタイム配信"""

    body = await request.body()
    data = json.loads(body.decode())
    user_instruction = data.get("text", "")

    async def event_generator() -> AsyncGenerator[dict]:
        try:
            if not user_instruction.strip():
                yield {"data": json.dumps({"type": "error", "text": "指示が空です"})}
                return

            chat_service = ChatService(api_key=get_anthropic_api_key())
            code_executor = CodeExecutorService(project_root=get_project_root())

            yield {"data": json.dumps({"type": "status", "text": "考え中..."})}

            project_context = code_executor.get_project_context()

            # ストリーミングでAI応答をリアルタイム配信
            full_response = ""
            async for chunk in chat_service.stream_generate_code(
                instruction=user_instruction,
                project_context=project_context,
            ):
                full_response += chunk
                yield {"data": json.dumps({"type": "ai_chunk", "text": chunk})}

            # ストリーム完了後にパースしてファイル変更を適用
            result = chat_service.parse_response(full_response)

            yield {"data": json.dumps({"type": "ai_done", "explanation": result.explanation})}

            if result.file_changes:
                results = code_executor.apply_changes(result.file_changes)

                for r in results:
                    yield {"data": json.dumps({"type": "file_change", "path": r["path"], "action": r["action"]})}

                commit_message = code_executor.auto_commit(user_instruction)
                if commit_message:
                    yield {"data": json.dumps({"type": "commit", "message": commit_message})}

            yield {"data": json.dumps({"type": "complete"})}

        except Exception as e:
            yield {"data": json.dumps({"type": "error", "text": f"エラー: {e}\n{traceback.format_exc()}"})}

    return EventSourceResponse(event_generator())
