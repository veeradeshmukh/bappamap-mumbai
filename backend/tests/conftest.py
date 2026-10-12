import sys
from pathlib import Path

import httpx
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.main import app

# Create NullPool engine for tests to avoid asyncpg loop-binding issues across test cases
test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


from sqlalchemy import text


@pytest_asyncio.fixture(autouse=True)
async def clean_rate_limits():
    async with TestSessionLocal() as session:
        await session.execute(text("DELETE FROM rate_limits;"))
        await session.commit()
    yield


@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_cookies(client: httpx.AsyncClient):
    res = await client.post(
        "/api/admin/auth/login",
        json={"password": settings.ADMIN_PASSWORD},
    )
    assert res.status_code == 200
    return res.cookies
