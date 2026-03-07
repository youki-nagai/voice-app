from typing import Annotated

from anthropic import AsyncAnthropic
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.repository import ChatRepository
from app.claude_code.service import ClaudeCodeService
from app.config import get_anthropic_api_key, get_project_root
from app.database import get_session
from app.voice.classifier import VoiceCommandClassifier


def get_claude_code_service() -> ClaudeCodeService:
    return ClaudeCodeService(project_root=get_project_root())


async def get_chat_repository(session: AsyncSession = Depends(get_session)) -> ChatRepository:
    return ChatRepository(session)


def get_voice_command_classifier() -> VoiceCommandClassifier:
    return VoiceCommandClassifier(client=AsyncAnthropic(api_key=get_anthropic_api_key()))


ClaudeCodeDep = Annotated[ClaudeCodeService, Depends(get_claude_code_service)]
ChatRepoDep = Annotated[ChatRepository, Depends(get_chat_repository)]
ClassifierDep = Annotated[VoiceCommandClassifier, Depends(get_voice_command_classifier)]
