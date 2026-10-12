import uuid
from datetime import UTC, datetime

from backend.app.db.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mandal_id = Column(UUID(as_uuid=True), ForeignKey("mandals.id", ondelete="CASCADE"), nullable=False, index=True)
    author_display_name = Column(String(100), default="Devotee", nullable=False)
    rating = Column(Integer, nullable=False)
    crowd_observation = Column(String(20), nullable=True)
    comment = Column(Text, nullable=True)
    moderation_status = Column(String(20), default="published", nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    mandal = relationship("Mandal", back_populates="reviews")
