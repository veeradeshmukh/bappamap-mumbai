import uuid
from datetime import UTC, datetime

from backend.app.db.session import Base
from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_type = Column(String(50), nullable=False, index=True)  # 'new_mandal', 'review', 'photo'
    payload = Column(JSONB, nullable=False)
    ip_hash = Column(String(64), nullable=False, index=True)
    moderation_status = Column(String(20), default="pending", nullable=False, index=True)  # 'pending', 'approved', 'rejected', 'flagged'
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
