import asyncio

import pytest
from backend.app.services.broadcaster import broadcaster


@pytest.mark.asyncio
async def test_sse_event_broadcast():
    # 1. Subscribe to the SSE broadcaster
    queue = await broadcaster.subscribe()

    # 2. Broadcast an event
    test_event_data = {
        "slug": "lalbaugcha-raja",
        "queueType": "charan_sparsh",
        "crowdLevel": "very_heavy",
    }
    await broadcaster.broadcast("crowd_updated", test_event_data)

    # 3. Retrieve event from subscriber queue
    received = await asyncio.wait_for(queue.get(), timeout=2.0)
    assert received["event"] == "crowd_updated"
    assert received["data"]["slug"] == "lalbaugcha-raja"
    assert received["data"]["crowdLevel"] == "very_heavy"

    # Cleanup
    await broadcaster.unsubscribe(queue)
