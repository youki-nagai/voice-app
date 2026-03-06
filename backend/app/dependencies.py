from typing import Annotated

from fastapi import Depends

from app.chat.service import ChatService
from app.code_executor.service import CodeExecutorService
from app.config import get_anthropic_api_key, get_project_root


def get_chat_service() -> ChatService:
    return ChatService(api_key=get_anthropic_api_key())


def get_code_executor_service() -> CodeExecutorService:
    return CodeExecutorService(project_root=get_project_root())


ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
CodeExecutorDep = Annotated[CodeExecutorService, Depends(get_code_executor_service)]
