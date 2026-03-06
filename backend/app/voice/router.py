import json
import traceback
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from sse_starlette import EventSourceResponse

from app.chat.service import ChatService
from app.code_executor.service import CodeExecutorService
from app.config import get_anthropic_api_key, get_project_root

router = APIRouter()


@router.post("/stream")
async def voice_stream(request: Request):
    """SSEストリームでAI応答を配信"""
    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # リクエストボディから指示を取得
            body = await request.body()
            data = json.loads(body.decode())
            user_instruction = data.get("text", "")
            
            if not user_instruction.strip():
                yield f"data: {json.dumps({'type': 'error', 'text': '指示が空です'})}\n\n"
                return

            chat_service = ChatService(api_key=get_anthropic_api_key())
            code_executor = CodeExecutorService(project_root=get_project_root())

            # ステータス送信
            yield f"data: {json.dumps({'type': 'status', 'text': '考え中...'})}\n\n"

            # プロジェクトのファイル構造を取得
            project_context = code_executor.get_project_context()

            yield f"data: {json.dumps({'type': 'status', 'text': 'AIがコードを生成中...'})}\n\n"

            # Claude APIでコード生成
            ai_response = await chat_service.generate_code(
                instruction=user_instruction,
                project_context=project_context,
            )

            yield f"data: {json.dumps({'type': 'ai_response', 'text': ai_response.explanation})}\n\n"

            # ファイル変更を適用
            if ai_response.file_changes:
                results = code_executor.apply_changes(ai_response.file_changes)

                for result in results:
                    yield f"data: {json.dumps({'type': 'file_change', 'path': result['path'], 'action': result['action']})}\n\n"

                # 自動コミット
                commit_message = code_executor.auto_commit(user_instruction)
                if commit_message:
                    yield f"data: {json.dumps({'type': 'commit', 'message': commit_message})}\n\n"

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            error_data = {
                "type": "error",
                "text": f"エラー: {e}\n{traceback.format_exc()}"
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return EventSourceResponse(event_generator())