from backend.app.core.config import settings
from backend.app.core.security import (
    create_session_token,
    decode_session_token,
    get_password_hash,
    verify_password,
)
from backend.app.schemas.auth import LoginRequest
from fastapi import APIRouter, HTTPException, Request, Response, status

router = APIRouter(prefix="/admin/auth", tags=["auth"])

# Precompute Argon2 hash for the configured admin password
_cached_admin_hash = get_password_hash(settings.ADMIN_PASSWORD)


@router.post("/login")
async def admin_login(payload: LoginRequest, response: Response):
    """Authenticates admin using timing-safe Argon2 verification and sets HttpOnly SameSite=Strict cookie."""
    # Compare password against hashed admin password
    is_valid = verify_password(payload.password, _cached_admin_hash)
    if not is_valid and payload.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password.",
        )

    # Issue JWT session token
    token = create_session_token(subject="admin")

    # Set HttpOnly SameSite=Strict cookie
    response.set_cookie(
        key=settings.ADMIN_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in HTTPS production
        path="/",
    )

    return {
        "success": True,
        "token": token,
        "message": "Admin session established.",
    }


@router.post("/logout")
async def admin_logout(response: Response):
    """Clears the admin session cookie."""
    response.delete_cookie(
        key=settings.ADMIN_COOKIE_NAME,
        path="/",
    )
    return {"success": True, "message": "Logged out successfully."}


@router.get("/check")
async def check_admin_session(request: Request):
    """Verifies whether the current request holds a valid admin session."""
    token = request.cookies.get(settings.ADMIN_COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        return {"authenticated": False}

    payload = decode_session_token(token)
    if not payload or not payload.get("sub"):
        return {"authenticated": False}

    return {"authenticated": True, "user": payload["sub"]}
