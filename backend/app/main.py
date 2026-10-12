import logging
from contextlib import asynccontextmanager
from pathlib import Path

from backend.app.api.routers import auth, crowd, events, mandals, submissions, transliterate
from backend.app.core.config import settings
from backend.app.db.session import engine, get_db
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Configure logging without IP addresses
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bappamap")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting BappaMap Mumbai Backend...")
    # Ensure local upload directories exist
    upload_dir = Path(settings.LOCAL_STORAGE_DIR)
    (upload_dir / "quarantine").mkdir(parents=True, exist_ok=True)
    (upload_dir / "public").mkdir(parents=True, exist_ok=True)
    yield
    logger.info("Shutting down BappaMap Mumbai Backend...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local upload directory for local photo previews
upload_dir = Path(settings.LOCAL_STORAGE_DIR)
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/media", StaticFiles(directory=str(upload_dir)), name="media")

# Include Routers
app.include_router(mandals.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(crowd.router, prefix="/api")
app.include_router(transliterate.router, prefix="/api")


@app.get("/health", tags=["system"])
async def health_check(session: AsyncSession = Depends(get_db)):
    """Health check endpoint verifying database and PostGIS extension status."""
    try:
        postgis_ver = await session.scalar(text("SELECT PostGIS_Version();"))
        return {
            "status": "healthy",
            "database": "connected",
            "postgis_version": postgis_ver,
            "version": settings.VERSION,
        }
    except Exception as exc:
        logger.error(f"Health check failed: {exc}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(exc),
        }
