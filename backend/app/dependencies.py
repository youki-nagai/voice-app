from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.repository import ChatRepository
from app.claude_code.service import ClaudeCodeService
from app.config import get_project_root
from app.database import get_session


def get_claude_code_service() -> ClaudeCodeService:
    return ClaudeCodeService(project_root=get_project_root())


async def get_chat_repository(session: AsyncSession = Depends(get_session)) -> ChatRepository:
    return ChatRepository(session)


ClaudeCodeDep = Annotated[ClaudeCodeService, Depends(get_claude_code_service)]
ChatRepoDep = Annotated[ChatRepository, Depends(get_chat_repository)]
