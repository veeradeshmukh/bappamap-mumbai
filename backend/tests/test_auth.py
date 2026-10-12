import httpx
import pytest
from backend.app.core.config import settings
from backend.app.core.security import hash_client_ip


@pytest.mark.asyncio
async def test_admin_login_success(client: httpx.AsyncClient):
    res = await client.post(
        "/api/admin/auth/login",
        json={"password": settings.ADMIN_PASSWORD},
    )
    assert res.status_code == 200
    assert res.json()["success"] is True
    assert settings.ADMIN_COOKIE_NAME in res.cookies


@pytest.mark.asyncio
async def test_admin_login_failure(client: httpx.AsyncClient):
    res = await client.post(
        "/api/admin/auth/login",
        json={"password": "wrong-password-1234"},
    )
    assert res.status_code == 401
    assert settings.ADMIN_COOKIE_NAME not in res.cookies


@pytest.mark.asyncio
async def test_admin_auth_check(client: httpx.AsyncClient):
    # Unauthenticated
    res_unauth = await client.get("/api/admin/auth/check")
    assert res_unauth.status_code == 200
    assert res_unauth.json()["authenticated"] is False

    # Authenticate
    login_res = await client.post(
        "/api/admin/auth/login",
        json={"password": settings.ADMIN_PASSWORD},
    )
    assert login_res.status_code == 200

    # Authenticated
    res_auth = await client.get("/api/admin/auth/check")
    assert res_auth.status_code == 200
    assert res_auth.json()["authenticated"] is True


def test_dpdp_ip_hash_irreversible():
    ip = "203.0.113.195"
    h1 = hash_client_ip(ip)
    h2 = hash_client_ip(ip)
    assert h1 == h2
    assert ip not in h1
    assert len(h1) == 64
