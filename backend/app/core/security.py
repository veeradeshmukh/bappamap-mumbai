import hashlib
import hmac
import time
from typing import Any

import jwt
from backend.app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_client_ip(ip: str) -> str:
    """Computes a privacy-preserving one-way salted HMAC-SHA256 hash of a client IP address.

    Satisfies Digital Personal Data Protection (DPDP) Act 2023 obligations.
    Raw client IP addresses are never logged or stored.
    """
    clean_ip = ip.split(",")[0].strip()
    return hmac.new(
        settings.RATE_LIMIT_SALT.encode("utf-8"),
        clean_ip.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def get_password_hash(password: str) -> str:
    """Computes Argon2 hash of a password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against Argon2 hash with fallback to constant-time secret check."""
    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception:
        pass
    return hmac.compare_digest(plain_password, settings.ADMIN_PASSWORD)


def verify_admin_password(plain_password: str) -> bool:
    """Constant-time comparison verifying admin password against configured secret."""
    if not plain_password:
        return False
    return hmac.compare_digest(plain_password, settings.ADMIN_PASSWORD)


def create_session_token(subject: str = "admin") -> str:
    """Creates a cryptographically signed JWT session token with expiration timestamp."""
    payload = {
        "sub": subject,
        "exp": int(time.time()) + settings.SESSION_MAX_AGE_SECONDS,
        "iat": int(time.time()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_session_token(token: str) -> dict[str, Any] | None:
    """Verifies JWT signature and expiry. Returns payload if valid, None otherwise."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except (jwt.PyJWTError, ValueError):
        return None


verify_session_token = decode_session_token
