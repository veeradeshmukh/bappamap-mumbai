from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CrowdStatus(BaseModel):
    level: str  # 'low', 'moderate', 'heavy', 'very_heavy'
    confidence: float = 1.0  # 0.0 to 1.0
    last_updated: str | None = None
    report_count: int = 0


class MandalAttributes(BaseModel):
    parking_nearby: bool = False
    wheelchair_accessible: bool = False
    darshan_types: list[str] = Field(default_factory=list)
    nearest_station: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True)


class MandalResponse(BaseModel):
    id: UUID
    slug: str
    name_en: str = Field(alias="nameEn")
    name_mr: str = Field(alias="nameMr")
    locality_en: str = Field(alias="localityEn")
    locality_mr: str = Field(alias="localityMr")
    bmc_ward: str = Field(alias="bmcWard")
    founded_year: int | None = Field(None, alias="foundedYear")
    latitude: float
    longitude: float
    google_place_id: str | None = Field(None, alias="googlePlaceId")
    description_en: str | None = Field(None, alias="descriptionEn")
    description_mr: str | None = Field(None, alias="descriptionMr")
    current_crowd_level: str = Field(default="moderate", alias="currentCrowdLevel")
    avg_rating: float = Field(default=0.0, alias="avgRating")
    review_count: int = Field(default=0, alias="reviewCount")
    is_active: bool = Field(default=True, alias="isActive")
    attributes: dict[str, Any] = Field(default_factory=dict)
    
    # Core differentiator: separate queue crowd analytics
    mukh_darshan_crowd: CrowdStatus | None = Field(None, alias="mukhDarshanCrowd")
    charan_sparsh_crowd: CrowdStatus | None = Field(None, alias="charanSparshCrowd")

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
