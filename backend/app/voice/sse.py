import asyncio
import json
from collections.abc import AsyncGenerator

KEEPALIVE_INTERVAL_SECONDS = 15


def sse_event(data: dict) -> dict:
    return {"data": json.dumps(data)}


async def stream_with_keepalive(
    source: AsyncGenerator[dict],
    interval: float = KEEPALIVE_INTERVAL_SECONDS,
) -> AsyncGenerator[dict]:
    """ソースジェネレータのイベントを中継し、無通信時に keepalive を送る。"""
    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    task_error: list[Exception] = []

    async def collect() -> None:
        try:
            async for event in source:
                await queue.put(event)
        except Exception as e:
            task_error.append(e)
        finally:
            await queue.put(None)

    task = asyncio.create_task(collect())
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=interval)
            except TimeoutError:
                yield sse_event({"type": "keepalive"})
                continue

            if event is None:
                break
            yield sse_event(event)

        if task_error:
            raise task_error[0]
    finally:
        if not task.done():
            task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception):
            pass
