import uuid
from datetime import UTC, datetime

from backend.app.db.session import Base
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship


class CrowdReport(Base):
    __tablename__ = "crowd_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mandal_id = Column(UUID(as_uuid=True), ForeignKey("mandals.id", ondelete="CASCADE"), nullable=False, index=True)
    crowd_level = Column(String(20), nullable=False)  # 'low', 'moderate', 'heavy', 'very_heavy'
    queue_type = Column(String(30), default="mukh_darshan", nullable=False)  # 'mukh_darshan' | 'charan_sparsh'
    ip_hash = Column(String(64), nullable=False)
    reported_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False, index=True)

    mandal = relationship("Mandal", back_populates="crowd_reports")
