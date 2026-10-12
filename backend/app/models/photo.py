import uuid
from datetime import UTC, datetime

from backend.app.db.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class Photo(Base):
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mandal_id = Column(UUID(as_uuid=True), ForeignKey("mandals.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_key = Column(String(255), unique=True, nullable=False)
    public_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    contributor_name = Column(String(100), default="Devotee", nullable=False)
    moderation_status = Column(String(20), default="published", nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    mandal = relationship("Mandal", back_populates="photos")
