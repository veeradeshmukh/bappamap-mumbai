import uuid
from datetime import datetime

from backend.app.db.session import Base
from sqlalchemy import DateTime, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column


class ModerationEvent(Base):
    __tablename__ = "moderation_events"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    submission_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True, index=True)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'submission', 'review', 'photo', 'mandal'
    target_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # 'approved', 'rejected', 'flagged'
    moderator_user: Mapped[str] = mapped_column(String(100), default="admin", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
