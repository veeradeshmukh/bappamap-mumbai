from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class NewMandalPayload(BaseModel):
    name_en: str = Field(alias="nameEn")
    name_mr: str | None = Field(None, alias="nameMr")
    locality_en: str = Field(alias="localityEn")
    locality_mr: str | None = Field(None, alias="localityMr")
    bmc_ward: str | None = Field("D", alias="bmcWard")
    founded_year: int | None = Field(None, alias="foundedYear")
    latitude: float
    longitude: float
    description_en: str | None = Field(None, alias="descriptionEn")
    description_mr: str | None = Field(None, alias="descriptionMr")
    attributes: dict[str, Any] | None = Field(default_factory=dict)

    model_config = ConfigDict(populate_by_name=True)


class ReviewPayload(BaseModel):
    mandal_id: str | None = Field(None, alias="mandalId")
    mandal_slug: str | None = Field(None, alias="mandalSlug")
    author_display_name: str = Field(default="Devotee", alias="authorDisplayName")
    rating: int = Field(ge=1, le=5)
    crowd_observation: str | None = Field(None, alias="crowdObservation")
    comment: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class PhotoPayload(BaseModel):
    mandal_id: str | None = Field(None, alias="mandalId")
    mandal_slug: str | None = Field(None, alias="mandalSlug")
    contributor_name: str = Field(default="Devotee", alias="contributorName")
    caption: str | None = None
    photo_data_url: str | None = Field(None, alias="photoDataUrl")
    photo_key: str | None = Field(None, alias="photoKey")

    model_config = ConfigDict(populate_by_name=True)


class CrowdReportPayload(BaseModel):
    mandal_id: str | None = Field(None, alias="mandalId")
    mandal_slug: str | None = Field(None, alias="mandalSlug")
    crowd_level: str = Field(alias="crowdLevel")  # 'low', 'moderate', 'heavy', 'very_heavy'
    queue_type: str = Field(default="mukh_darshan", alias="queueType")  # 'mukh_darshan' | 'charan_sparsh'

    model_config = ConfigDict(populate_by_name=True)


class SubmissionCreate(BaseModel):
    submission_type: str = Field(alias="submissionType")  # 'new_mandal', 'review', 'photo', 'crowd_update'
    payload: dict[str, Any]
    turnstile_token: str | None = Field(None, alias="turnstileToken")
    honeypot: str | None = None  # Must remain empty

    model_config = ConfigDict(populate_by_name=True)


class SubmissionResponse(BaseModel):
    id: str = Field(alias="submissionId")
    message: str
    status: str = "pending"

    model_config = ConfigDict(populate_by_name=True)


class ModerationActionRequest(BaseModel):
    action: str  # 'approve', 'reject', 'flag'
    notes: str | None = None


class SubmissionItem(BaseModel):
    id: str
    submission_type: str = Field(alias="submissionType")
    payload: dict[str, Any]
    status: str
    created_at: str = Field(alias="createdAt")
    photo_data_url: str | None = Field(None, alias="photoDataUrl")
    reviewed_at: str | None = Field(None, alias="reviewedAt")
    reviewed_by: str | None = Field(None, alias="reviewedBy")
    reviewer_notes: str | None = Field(None, alias="reviewerNotes")

    model_config = ConfigDict(populate_by_name=True)


class ModerationQueueResponse(BaseModel):
    submissions: list[SubmissionItem]
    stats: dict[str, int]
