import json
import traceback

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.chat.service import ChatService
from app.code_executor.service import CodeExecutorService
from app.config import get_anthropic_api_key, get_project_root

router = APIRouter()


@router.websocket("/ws")
async def voice_websocket(websocket: WebSocket):
    await websocket.accept()

    # テスト用の接続確認メッセージ
    await websocket.send_text(
        json.dumps(
            {
                "type": "status",
                "text": "音声入力テスト開始 - マイクボタンを押して話してください",
            }
        )
    )

    chat_service = ChatService(api_key=get_anthropic_api_key())
    code_executor = CodeExecutorService(project_root=get_project_root())

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "transcript":
                # リアルタイム音声テキストを受信（表示用にエコーバック）
                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "transcript",
                            "text": message["text"],
                            "is_final": message.get("is_final", False),
                        }
                    )
                )

            elif message["type"] == "voice_complete":
                # 音声が途切れた → AIがコード生成開始
                user_instruction = message["text"]

                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "status",
                            "text": "AIがコードを生成中...",
                        }
                    )
                )

                # プロジェクトのファイル構造を取得
                project_context = code_executor.get_project_context()

                # Claude APIでコード生成
                ai_response = await chat_service.generate_code(
                    instruction=user_instruction,
                    project_context=project_context,
                )

                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "ai_response",
                            "text": ai_response.explanation,
                        }
                    )
                )

                # ファイル変更を適用
                if ai_response.file_changes:
                    results = code_executor.apply_changes(ai_response.file_changes)

                    for result in results:
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "file_change",
                                    "path": result["path"],
                                    "action": result["action"],
                                }
                            )
                        )

                    # 自動コミット
                    commit_message = code_executor.auto_commit(user_instruction)
                    if commit_message:
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "commit",
                                    "message": commit_message,
                                }
                            )
                        )

                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "complete",
                        }
                    )
                )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "error",
                        "text": f"エラー: {e}\n{traceback.format_exc()}",
                    }
                )
            )
        except Exception:
            pass
