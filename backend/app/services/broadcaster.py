import asyncio
import json
from collections.abc import AsyncGenerator
from typing import Any


class EventBroadcaster:
    def __init__(self):
        self._subscribers: set[asyncio.Queue] = set()
        self._lock = asyncio.Lock()

    async def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        async with self._lock:
            self._subscribers.add(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue):
        async with self._lock:
            self._subscribers.discard(queue)

    async def broadcast(self, event_type: str, data: dict[str, Any]):
        message = {
            "event": event_type,
            "data": data,
        }
        async with self._lock:
            for queue in list(self._subscribers):
                try:
                    await queue.put(message)
                except Exception:
                    self._subscribers.discard(queue)

    async def event_generator(self, queue: asyncio.Queue) -> AsyncGenerator[str, None]:
        try:
            # Send initial keepalive
            yield f"event: connected\ndata: {json.dumps({'status': 'connected'})}\n\n"
            while True:
                try:
                    # Wait for next event with a 20s timeout for keepalive comments
                    message = await asyncio.wait_for(queue.get(), timeout=20.0)
                    event_type = message.get("event", "message")
                    payload = json.dumps(message.get("data", {}))
                    yield f"event: {event_type}\ndata: {payload}\n\n"
                except TimeoutError:
                    # Heartbeat to keep connection alive through proxies
                    yield ": ping\n\n"
        finally:
            await self.unsubscribe(queue)


broadcaster = EventBroadcaster()
