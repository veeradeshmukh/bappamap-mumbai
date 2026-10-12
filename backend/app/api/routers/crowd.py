import uuid

from backend.app.api.deps import get_client_ip, get_client_ip_hash, get_db
from backend.app.models.submission import Submission
from backend.app.services.rate_limiter import check_persistent_rate_limit
from backend.app.services.turnstile import verify_turnstile_token
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/crowd", tags=["crowd"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_crowd_observation(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """Submits a crowd status observation for a mandal."""
    body = await request.json()
    client_ip = get_client_ip(request)
    ip_hash = get_client_ip_hash(request)

    await check_persistent_rate_limit(session, ip_hash=ip_hash, action="submit_crowd")

    token = body.get("turnstileToken") or body.get("turnstile_token")
    is_valid, err = await verify_turnstile_token(token, client_ip=client_ip)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err or "Bot challenge failed")

    sub_id = uuid.uuid4()
    submission = Submission(
        id=sub_id,
        submission_type="crowd_report",
        payload=body,
        ip_hash=ip_hash,
        moderation_status="pending",
    )
    session.add(submission)
    await session.commit()

    return {
        "submissionId": str(sub_id),
        "status": "pending",
        "message": "Crowd report queued for verification.",
    }
