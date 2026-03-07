import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Message, Thread


class ChatRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_or_create_thread(self, session_id: str) -> Thread:
        result = await self._session.execute(select(Thread).where(Thread.session_id == session_id))
        thread = result.scalar_one_or_none()
        if thread:
            return thread
        thread = Thread(session_id=session_id)
        self._session.add(thread)
        await self._session.flush()
        return thread

    async def add_message(
        self,
        thread_id: uuid.UUID,
        role: str,
        text: str,
        model: str | None = None,
        images: list[str] | None = None,
        tool_actions: list[dict] | None = None,
    ) -> Message:
        message = Message(
            thread_id=thread_id,
            role=role,
            text=text,
            model=model,
            images=images,
            tool_actions=tool_actions,
        )
        self._session.add(message)
        await self._session.flush()
        return message

    async def update_thread_title(self, thread_id: uuid.UUID, title: str) -> None:
        result = await self._session.execute(select(Thread).where(Thread.id == thread_id))
        thread = result.scalar_one()
        thread.title = title

    async def commit(self) -> None:
        await self._session.commit()
