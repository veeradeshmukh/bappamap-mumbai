from backend.app.core.config import settings
from backend.app.core.security import decode_session_token, hash_client_ip
from backend.app.db.session import get_db as get_db
from fastapi import HTTPException, Request, status


def get_client_ip(request: Request) -> str:
    """Extracts client IP from proxy headers or socket."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    return request.client.host if request.client else "127.0.0.1"


def get_client_ip_hash(request: Request) -> str:
    """Returns DPDP-compliant one-way salted HMAC-SHA256 hash of client IP.

    Never logs or persists raw IP.
    """
    raw_ip = get_client_ip(request)
    return hash_client_ip(raw_ip)


async def get_current_admin(request: Request) -> str:
    """Guards moderation endpoints.

    Requires valid admin session cookie or Authorization Bearer header.
    """
    token = request.cookies.get(settings.ADMIN_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin session required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_session_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload["sub"]
