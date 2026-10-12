import uuid
from datetime import datetime

from backend.app.db.session import Base
from sqlalchemy import DateTime, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column


class RateLimitRecord(Base):
    __tablename__ = "rate_limits"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    window_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
