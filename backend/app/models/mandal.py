import uuid
from datetime import UTC, datetime

from backend.app.db.session import Base
from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship


class Mandal(Base):
    __tablename__ = "mandals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name_en = Column(String(255), nullable=False)
    name_mr = Column(String(255), nullable=False)
    locality_en = Column(String(100), nullable=False)
    locality_mr = Column(String(100), nullable=False)
    bmc_ward = Column(String(10), nullable=False)
    founded_year = Column(Integer, nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    google_place_id = Column(String(255), nullable=True)
    description_en = Column(Text, nullable=True)
    description_mr = Column(Text, nullable=True)

    current_crowd_level = Column(String(20), default="moderate", nullable=False)
    avg_rating = Column(Float, default=0.0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)

    metadata_json = Column(JSONB, default=dict, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    attributes = relationship("MandalAttribute", back_populates="mandal", cascade="all, delete-orphan", lazy="selectin")
    reviews = relationship("Review", back_populates="mandal", cascade="all, delete-orphan")
    photos = relationship("Photo", back_populates="mandal", cascade="all, delete-orphan")
    crowd_reports = relationship("CrowdReport", back_populates="mandal", cascade="all, delete-orphan")


class MandalAttribute(Base):
    __tablename__ = "mandal_attributes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mandal_id = Column(UUID(as_uuid=True), ForeignKey("mandals.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute_key = Column(String(50), nullable=False)
    attribute_value = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    mandal = relationship("Mandal", back_populates="attributes")
