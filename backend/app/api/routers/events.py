from backend.app.services.broadcaster import broadcaster
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
async def stream_events():
    """Server-Sent Events (SSE) endpoint for real-time map updates.

    Streams newly approved mandals, live crowd-tier updates, and new approved reviews
    without requiring client page reloads.
    """
    queue = await broadcaster.subscribe()
    return EventSourceResponse(
        broadcaster.event_generator(queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
