from datetime import UTC, datetime, timedelta

from backend.app.core.config import settings
from backend.app.models.rate_limit import RateLimitRecord
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def check_persistent_rate_limit(
    session: AsyncSession,
    ip_hash: str,
    action: str = "submit",
    max_requests: int = settings.RATE_LIMIT_MAX_REQUESTS,
    window_seconds: int = settings.RATE_LIMIT_WINDOW_SECONDS,
) -> None:
    """Enforces DPDP-compliant multi-instance rate limiting stored in PostgreSQL.

    Raises HTTPException(429) if exceeded.
    """
    key = f"{ip_hash}:{action}"
    now = datetime.now(UTC)

    # 1. Fetch existing record
    stmt = select(RateLimitRecord).where(RateLimitRecord.key == key)
    res = await session.execute(stmt)
    record = res.scalars().first()

    if record:
        # Check expiration
        if record.expires_at > now:
            if record.count >= max_requests:
                retry_after = int((record.expires_at - now).total_seconds())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded. Please wait before submitting again.",
                        "retry_after_seconds": max(1, retry_after),
                    },
                    headers={"Retry-After": str(max(1, retry_after))},
                )
            record.count += 1
            await session.commit()
            return
        else:
            # Expired window, reset
            record.count = 1
            record.window_start = now
            record.expires_at = now + timedelta(seconds=window_seconds)
            await session.commit()
            return

    # New record
    new_record = RateLimitRecord(
        key=key,
        count=1,
        window_start=now,
        expires_at=now + timedelta(seconds=window_seconds),
    )
    session.add(new_record)
    await session.commit()
