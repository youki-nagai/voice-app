import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.now,
        server_default=func.now(),
        onupdate=datetime.now,
    )


class Thread(Base):
    __tablename__ = "threads"

    session_id: Mapped[str] = mapped_column(unique=True, index=True)
    title: Mapped[str | None] = mapped_column(default=None)

    messages: Mapped[list["Message"]] = relationship(back_populates="thread", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    thread_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("threads.id", ondelete="CASCADE"), index=True)
    role: Mapped[str]  # "user" | "ai" | "system" | "error"
    text: Mapped[str] = mapped_column(Text, default="")
    model: Mapped[str | None] = mapped_column(default=None)
    images: Mapped[list[str] | None] = mapped_column(JSONB, default=None)
    tool_actions: Mapped[list[dict[str, str]] | None] = mapped_column(JSONB, default=None)

    thread: Mapped["Thread"] = relationship(back_populates="messages")
