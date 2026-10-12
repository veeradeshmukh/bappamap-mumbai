from datetime import UTC, datetime, timedelta
from uuid import UUID

from backend.app.api.deps import get_db
from backend.app.models.crowd_report import CrowdReport
from backend.app.models.mandal import Mandal
from backend.app.models.photo import Photo
from backend.app.models.review import Review
from backend.app.services.crowd_decay import calculate_decayed_crowd_level
from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2 import Geography
from geoalchemy2.functions import ST_DWithin, ST_MakeEnvelope, ST_MakePoint, ST_SetSRID
from sqlalchemy import cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/mandals", tags=["mandals"])


async def get_mandal_queue_crowd(session: AsyncSession, mandal_id: UUID) -> tuple[dict, dict, str]:
    """Computes decayed crowd stats for mukh_darshan and charan_sparsh queues."""
    cutoff = datetime.now(UTC) - timedelta(minutes=120)
    stmt = (
        select(CrowdReport)
        .where(
            CrowdReport.mandal_id == mandal_id,
            CrowdReport.reported_at >= cutoff,
        )
        .order_by(CrowdReport.reported_at.desc())
    )
    res = await session.execute(stmt)
    reports = res.scalars().all()

    mukh_reports = [
        {"crowd_level": r.crowd_level, "reported_at": r.reported_at}
        for r in reports
        if r.queue_type == "mukh_darshan"
    ]
    charan_reports = [
        {"crowd_level": r.crowd_level, "reported_at": r.reported_at}
        for r in reports
        if r.queue_type == "charan_sparsh"
    ]

    mukh_decay = calculate_decayed_crowd_level(mukh_reports, baseline_level="moderate")
    charan_decay = calculate_decayed_crowd_level(charan_reports, baseline_level="heavy")

    overall_level = mukh_decay.level if mukh_decay.active_report_count > 0 else "moderate"

    return (
        {
            "level": mukh_decay.level,
            "confidence": mukh_decay.confidence,
            "lastUpdated": mukh_decay.last_updated,
            "reportCount": mukh_decay.active_report_count,
        },
        {
            "level": charan_decay.level,
            "confidence": charan_decay.confidence,
            "lastUpdated": charan_decay.last_updated,
            "reportCount": charan_decay.active_report_count,
        },
        overall_level,
    )


@router.get("")
async def list_mandals(
    bbox: str | None = Query(None, description="Bounding box min_lng,min_lat,max_lng,max_lat"),
    nearby: str | None = Query(None, description="Nearby user-chosen map point: lng,lat,radius_meters"),
    parking: str | None = Query(None),
    wheelchair: str | None = Query(None),
    ward: str | None = Query(None),
    search: str | None = Query(None),
    session: AsyncSession = Depends(get_db),
):
    """Fetches active mandals with PostGIS spatial queries and live queue crowd intelligence."""
    stmt = select(Mandal).where(Mandal.is_active.is_(True))

    # 1. PostGIS Bounding Box Filter
    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) == 4:
                min_lng, min_lat, max_lng, max_lat = parts
                envelope = ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
                stmt = stmt.where(func.ST_Intersects(Mandal.location, envelope))
        except ValueError:
            pass

    # 2. PostGIS Nearby Filter (User-chosen point ONLY - Non-negotiable Invariant 1: Zero Geolocation)
    if nearby:
        try:
            parts = [float(x.strip()) for x in nearby.split(",")]
            if len(parts) >= 2:
                lng, lat = parts[0], parts[1]
                radius_m = parts[2] if len(parts) >= 3 else 2000.0  # default 2km
                user_pt = cast(ST_SetSRID(ST_MakePoint(lng, lat), 4326), Geography)
                stmt = stmt.where(ST_DWithin(cast(Mandal.location, Geography), user_pt, radius_m))
        except ValueError:
            pass

    # 3. BMC Ward filter
    if ward:
        stmt = stmt.where(Mandal.bmc_ward == ward.strip())

    # 4. Search Filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Mandal.name_en.ilike(term),
                Mandal.name_mr.ilike(term),
                Mandal.locality_en.ilike(term),
                Mandal.locality_mr.ilike(term),
                Mandal.slug.ilike(term),
            )
        )

    res = await session.execute(stmt)
    mandals = res.scalars().all()

    result = []
    for m in mandals:
        attrs = dict(m.metadata_json) if m.metadata_json else {}

        # Parking filter check
        if parking and parking.lower() == "true":
            if not attrs.get("parkingNearby"):
                continue

        # Wheelchair filter check
        if wheelchair and wheelchair.lower() == "true":
            if not attrs.get("wheelchairAccessible"):
                continue

        mukh_crowd, charan_crowd, overall_crowd = await get_mandal_queue_crowd(session, m.id)

        result.append({
            "id": str(m.id),
            "slug": m.slug,
            "nameEn": m.name_en,
            "nameMr": m.name_mr,
            "localityEn": m.locality_en,
            "localityMr": m.locality_mr,
            "bmcWard": m.bmc_ward,
            "foundedYear": m.founded_year or 2024,
            "latitude": float(m.latitude),
            "longitude": float(m.longitude),
            "descriptionEn": m.description_en or "",
            "descriptionMr": m.description_mr or m.description_en or "",
            "currentCrowdLevel": overall_crowd,
            "avgRating": float(m.avg_rating or 4.5),
            "reviewCount": int(m.review_count or 0),
            "attributes": attrs,
            # Core Differentiator: queue-aware darshan crowd analytics
            "mukhDarshanCrowd": mukh_crowd,
            "charanSparshCrowd": charan_crowd,
        })

    return result


@router.get("/{slug_or_id}")
async def get_mandal_detail(slug_or_id: str, session: AsyncSession = Depends(get_db)):
    """Fetches details for a single mandal by slug or UUID."""
    try:
        val_uuid = UUID(slug_or_id)
        stmt = select(Mandal).where(or_(Mandal.slug == slug_or_id, Mandal.id == val_uuid))
    except ValueError:
        stmt = select(Mandal).where(Mandal.slug == slug_or_id)

    res = await session.execute(stmt)
    m = res.scalars().first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mandal not found")

    mukh_crowd, charan_crowd, overall_crowd = await get_mandal_queue_crowd(session, m.id)

    # Approved reviews
    rev_stmt = select(Review).where(Review.mandal_id == m.id, Review.moderation_status == "approved")
    rev_res = await session.execute(rev_stmt)
    reviews = [
        {
            "id": str(r.id),
            "author": r.author_display_name,
            "rating": r.rating,
            "crowd": r.crowd_observation,
            "comment": r.comment,
            "createdAt": r.created_at.isoformat(),
        }
        for r in rev_res.scalars().all()
    ]

    # Approved photos
    pho_stmt = select(Photo).where(Photo.mandal_id == m.id, Photo.moderation_status == "approved")
    pho_res = await session.execute(pho_stmt)
    photos = [
        {
            "id": str(p.id),
            "url": p.public_url,
            "caption": p.caption,
            "contributor": p.contributor_name,
            "createdAt": p.created_at.isoformat(),
        }
        for p in pho_res.scalars().all()
    ]

    attrs = dict(m.metadata_json) if m.metadata_json else {}

    return {
        "id": str(m.id),
        "slug": m.slug,
        "nameEn": m.name_en,
        "nameMr": m.name_mr,
        "localityEn": m.locality_en,
        "localityMr": m.locality_mr,
        "bmcWard": m.bmc_ward,
        "foundedYear": m.founded_year or 2024,
        "latitude": float(m.latitude),
        "longitude": float(m.longitude),
        "descriptionEn": m.description_en or "",
        "descriptionMr": m.description_mr or m.description_en or "",
        "currentCrowdLevel": overall_crowd,
        "avgRating": float(m.avg_rating or 4.5),
        "reviewCount": int(m.review_count or 0),
        "attributes": attrs,
        "mukhDarshanCrowd": mukh_crowd,
        "charanSparshCrowd": charan_crowd,
        "reviews": reviews,
        "photos": photos,
    }
