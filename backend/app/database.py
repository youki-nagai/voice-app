from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_database_url


@lru_cache(maxsize=1)
def _get_engine():
    return create_async_engine(get_database_url(), echo=False)


@lru_cache(maxsize=1)
def _get_session_factory():
    return async_sessionmaker(_get_engine(), class_=AsyncSession, expire_on_commit=False)


def get_engine():
    return _get_engine()


async def get_session() -> AsyncIterator[AsyncSession]:
    async with _get_session_factory()() as session:
        yield session
