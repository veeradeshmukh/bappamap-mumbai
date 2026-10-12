import uuid
from datetime import UTC, datetime

from backend.app.api.deps import get_client_ip, get_client_ip_hash, get_current_admin, get_db
from backend.app.core.config import settings
from backend.app.models.crowd_report import CrowdReport
from backend.app.models.mandal import Mandal
from backend.app.models.moderation_event import ModerationEvent
from backend.app.models.photo import Photo
from backend.app.models.review import Review
from backend.app.models.submission import Submission
from backend.app.services.broadcaster import broadcaster
from backend.app.services.rate_limiter import check_persistent_rate_limit
from backend.app.services.storage import storage_service
from backend.app.services.turnstile import verify_turnstile_token
from fastapi import APIRouter, Depends, HTTPException, Request, status
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/submissions", tags=["submissions"])


def validate_south_mumbai_bounds(lat: float, lng: float):
    """Enforces Non-negotiable Invariant 2: Coordinates strictly within South Mumbai."""
    if not (settings.MIN_LAT <= lat <= settings.MAX_LAT and settings.MIN_LNG <= lng <= settings.MAX_LNG):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Coordinates ({lat}, {lng}) are outside South Mumbai festival bounds "
                f"[{settings.MIN_LNG}, {settings.MIN_LAT}] to [{settings.MAX_LNG}, {settings.MAX_LAT}]."
            ),
        )


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def create_submission(
    request: Request,
    session: AsyncSession = Depends(get_db),
):
    """Handles all user submissions into quarantine with Turnstile, Honeypot, and South Mumbai bounds checking."""
    # Handle both application/json and multipart/form-data
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
    else:
        form = await request.form()
        body = {}
        for k, v in form.items():
            if isinstance(v, str):
                body[k] = v

    # 1. Invariant 7: Honeypot check
    honeypot = body.get("honeypot") or body.get("website")
    if honeypot and str(honeypot).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Spam detection triggered.",
        )

    # 2. DPDP Salted IP Hashing & Persistent Rate Limiting
    client_ip = get_client_ip(request)
    ip_hash = get_client_ip_hash(request)
    sub_type = str(body.get("submissionType") or body.get("submission_type") or "review").strip()

    await check_persistent_rate_limit(session, ip_hash=ip_hash, action=f"submit_{sub_type}")

    # 3. Invariant 7: Cloudflare Turnstile Verification
    token = body.get("turnstileToken") or body.get("turnstile_token") or body.get("cf-turnstile-response")
    is_valid_bot_check, err_msg = await verify_turnstile_token(token, client_ip=client_ip)
    if not is_valid_bot_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg or "Bot verification challenge failed.",
        )

    # 4. Invariant 2: South Mumbai Boundary Validation (for new mandals)
    if sub_type in ("new_mandal", "mandal", "suggest"):
        lat = body.get("latitude") or (body.get("payload", {}).get("latitude") if isinstance(body.get("payload"), dict) else None)
        lng = body.get("longitude") or (body.get("payload", {}).get("longitude") if isinstance(body.get("payload"), dict) else None)
        if lat is not None and lng is not None:
            try:
                validate_south_mumbai_bounds(float(lat), float(lng))
            except ValueError:
                raise HTTPException(status_code=422, detail="Latitude and longitude must be numbers.") from None

    # 5. Handle quarantined photo storage if present
    photo_data = body.get("photoDataUrl") or body.get("photo_data_url")
    if photo_data:
        try:
            key, url = await storage_service.save_quarantine_image(photo_data)
            body["photoKey"] = key
            body["photoUrl"] = url
        except Exception:
            # Continue even if storage fails, saving the raw data
            pass

    # 6. Invariant 5: Quarantine Record Creation (status = 'pending')
    submission_id = uuid.uuid4()
    submission_record = Submission(
        id=submission_id,
        submission_type=sub_type,
        payload=body,
        ip_hash=ip_hash,
        moderation_status="pending",
    )
    session.add(submission_record)
    await session.commit()

    return {
        "submissionId": f"sub-{submission_id}",
        "message": "Submission received and quarantined for moderation review.",
        "status": "pending",
    }


@router.get("")
async def get_submissions_queue(
    status: str | None = None,
    status_filter: str | None = None,
    current_admin: str = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db),
):
    """Admin endpoint to list quarantined submissions and summary statistics."""
    # Query items
    effective_status = status or status_filter
    stmt = select(Submission).order_by(Submission.created_at.desc())
    if effective_status and effective_status != "all":
        stmt = stmt.where(Submission.moderation_status == effective_status)

    res = await session.execute(stmt)
    submissions = res.scalars().all()

    # Query counts
    total_count = await session.scalar(select(func.count(Submission.id)))
    pending_count = await session.scalar(select(func.count(Submission.id)).where(Submission.moderation_status == "pending"))
    approved_count = await session.scalar(select(func.count(Submission.id)).where(Submission.moderation_status == "approved"))
    rejected_count = await session.scalar(select(func.count(Submission.id)).where(Submission.moderation_status == "rejected"))
    flagged_count = await session.scalar(select(func.count(Submission.id)).where(Submission.moderation_status == "flagged"))

    result = []
    for s in submissions:
        payload = dict(s.payload) if s.payload else {}
        result.append({
            "id": f"sub-{s.id}",
            "submissionType": s.submission_type,
            "payload": payload,
            "status": s.moderation_status,
            "createdAt": s.created_at.isoformat() if s.created_at else datetime.now(UTC).isoformat(),
            "photoDataUrl": payload.get("photoDataUrl") or payload.get("photoUrl"),
            "reviewedAt": s.reviewed_at.isoformat() if s.reviewed_at else None,
            "reviewedBy": s.reviewed_by,
            "reviewerNotes": s.reviewer_notes,
        })

    return {
        "submissions": result,
        "stats": {
            "total": total_count or 0,
            "pending": pending_count or 0,
            "approved": approved_count or 0,
            "rejected": rejected_count or 0,
            "flagged": flagged_count or 0,
        },
    }


@router.patch("/{submission_id}")
async def moderate_submission(
    submission_id: str,
    request: Request,
    current_admin: str = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db),
):
    """Admin moderation endpoint: Approves, rejects, or flags a quarantined submission.

    On approval:
    - Promotes new mandal to the live map table with PostGIS geometry.
    - Applies approved crowd update to crowd_reports and recalculates crowd tiers.
    - Promotes approved photo to public bucket and creates photo record.
    - Broadcasts real-time SSE event to all connected clients!
    """
    body = await request.json()
    action = body.get("action", "").lower()
    notes = body.get("reviewerNotes") or body.get("notes") or body.get("reviewer_notes")

    status_map = {
        "approve": "approved",
        "approved": "approved",
        "reject": "rejected",
        "rejected": "rejected",
        "flag": "flagged",
        "flagged": "flagged",
    }
    new_status = status_map.get(action)
    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action: '{action}'. Allowed: approve, reject, flag.",
        )

    try:
        raw_id = submission_id.removeprefix("sub-")
        sub_uuid = uuid.UUID(raw_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid submission ID format.") from None

    stmt = select(Submission).where(Submission.id == sub_uuid)
    res = await session.execute(stmt)
    submission = res.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    now = datetime.now(UTC)
    submission.moderation_status = new_status
    submission.reviewed_at = now
    submission.reviewed_by = current_admin
    submission.reviewer_notes = notes

    # Log Moderation Audit Event
    audit_event = ModerationEvent(
        submission_id=submission.id,
        target_type=submission.submission_type,
        target_id=submission.id,
        action=new_status,
        moderator_user=current_admin,
        notes=notes,
    )
    session.add(audit_event)

    # If APPROVED: execute live promotion!
    payload = dict(submission.payload) if submission.payload else {}
    if new_status == "approved":
        sub_type = submission.submission_type

        # 1. New Mandal Approval
        if sub_type in ("new_mandal", "mandal", "suggest"):
            name_en = payload.get("nameEn") or payload.get("name_en") or "New Mandal"
            name_mr = payload.get("nameMr") or payload.get("name_mr") or name_en
            locality_en = payload.get("localityEn") or payload.get("locality_en") or "Girgaon"
            locality_mr = payload.get("localityMr") or payload.get("locality_mr") or locality_en
            bmc_ward = payload.get("bmcWard") or payload.get("bmc_ward") or "D"
            founded_year = payload.get("foundedYear") or payload.get("founded_year")
            lat = float(payload.get("latitude") or 18.95)
            lng = float(payload.get("longitude") or 72.82)
            desc_en = payload.get("descriptionEn") or payload.get("description_en") or ""
            desc_mr = payload.get("descriptionMr") or payload.get("description_mr") or desc_en

            # Generate unique slug
            import re
            base_slug = re.sub(r"[^a-z0-9]+", "-", name_en.lower()).strip("-")
            slug = base_slug
            idx = 1
            while True:
                exists = await session.scalar(select(func.count(Mandal.id)).where(Mandal.slug == slug))
                if not exists:
                    break
                slug = f"{base_slug}-{idx}"
                idx += 1

            point_geom = WKTElement(f"POINT({lng} {lat})", srid=4326)
            new_mandal = Mandal(
                slug=slug,
                name_en=name_en,
                name_mr=name_mr,
                locality_en=locality_en,
                locality_mr=locality_mr,
                bmc_ward=bmc_ward,
                founded_year=int(founded_year) if founded_year else 2024,
                latitude=lat,
                longitude=lng,
                location=point_geom,
                description_en=desc_en,
                description_mr=desc_mr,
                current_crowd_level="moderate",
                avg_rating=5.0,
                review_count=1,
                metadata_json=payload.get("attributes", {}),
                is_active=True,
            )
            session.add(new_mandal)
            await session.flush()

            # Broadcast SSE event for live map pin addition
            await broadcaster.broadcast("mandal_approved", {
                "mandal": {
                    "id": str(new_mandal.id),
                    "slug": new_mandal.slug,
                    "nameEn": new_mandal.name_en,
                    "nameMr": new_mandal.name_mr,
                    "localityEn": new_mandal.locality_en,
                    "localityMr": new_mandal.locality_mr,
                    "bmcWard": new_mandal.bmc_ward,
                    "foundedYear": new_mandal.founded_year,
                    "latitude": new_mandal.latitude,
                    "longitude": new_mandal.longitude,
                    "currentCrowdLevel": new_mandal.current_crowd_level,
                    "avgRating": new_mandal.avg_rating,
                    "reviewCount": new_mandal.review_count,
                    "attributes": new_mandal.metadata_json,
                }
            })

        # 2. Crowd Report Approval
        elif sub_type in ("crowd_report", "crowd_update", "crowd"):
            mandal_id_str = payload.get("mandalId") or payload.get("mandal_id")
            mandal_slug = payload.get("mandalSlug") or payload.get("mandal_slug")
            target_mandal = None
            if mandal_id_str:
                try:
                    target_mandal = await session.get(Mandal, uuid.UUID(mandal_id_str))
                except Exception:
                    pass
            if not target_mandal and mandal_slug:
                res_m = await session.execute(select(Mandal).where(Mandal.slug == mandal_slug))
                target_mandal = res_m.scalars().first()

            if target_mandal:
                crowd_level = payload.get("crowdLevel") or payload.get("crowd_level") or "moderate"
                queue_type = payload.get("queueType") or payload.get("queue_type") or "mukh_darshan"
                report = CrowdReport(
                    mandal_id=target_mandal.id,
                    crowd_level=crowd_level,
                    queue_type=queue_type,
                    ip_hash=submission.ip_hash,
                )
                session.add(report)
                await session.flush()

                # Broadcast SSE event for live pin & card crowd tier update
                await broadcaster.broadcast("crowd_updated", {
                    "mandalId": str(target_mandal.id),
                    "slug": target_mandal.slug,
                    "queueType": queue_type,
                    "crowdLevel": crowd_level,
                })

        # 3. Review Approval
        elif sub_type in ("review", "feedback"):
            mandal_id_str = payload.get("mandalId") or payload.get("mandal_id")
            mandal_slug = payload.get("mandalSlug") or payload.get("mandal_slug")
            target_mandal = None
            if mandal_id_str:
                try:
                    target_mandal = await session.get(Mandal, uuid.UUID(mandal_id_str))
                except Exception:
                    pass
            if not target_mandal and mandal_slug:
                res_m = await session.execute(select(Mandal).where(Mandal.slug == mandal_slug))
                target_mandal = res_m.scalars().first()

            if target_mandal:
                rating = int(payload.get("rating") or 5)
                review = Review(
                    mandal_id=target_mandal.id,
                    author_display_name=payload.get("authorDisplayName") or payload.get("name") or "Devotee",
                    rating=rating,
                    crowd_observation=payload.get("crowdObservation"),
                    comment=payload.get("comment"),
                    moderation_status="approved",
                )
                session.add(review)

                # Update mandal review counts & rating
                current_reviews = target_mandal.review_count or 0
                current_avg = float(target_mandal.avg_rating or 5.0)
                new_avg = ((current_avg * current_reviews) + rating) / (current_reviews + 1)
                target_mandal.review_count = current_reviews + 1
                target_mandal.avg_rating = round(new_avg, 2)

                await broadcaster.broadcast("review_approved", {
                    "mandalId": str(target_mandal.id),
                    "slug": target_mandal.slug,
                    "newRating": target_mandal.avg_rating,
                    "reviewCount": target_mandal.review_count,
                })

        # 4. Photo Approval
        elif sub_type in ("photo", "upload"):
            mandal_id_str = payload.get("mandalId") or payload.get("mandal_id")
            mandal_slug = payload.get("mandalSlug") or payload.get("mandal_slug")
            target_mandal = None
            if mandal_id_str:
                try:
                    target_mandal = await session.get(Mandal, uuid.UUID(mandal_id_str))
                except Exception:
                    pass
            if not target_mandal and mandal_slug:
                res_m = await session.execute(select(Mandal).where(Mandal.slug == mandal_slug))
                target_mandal = res_m.scalars().first()

            if target_mandal:
                photo_key = payload.get("photoKey")
                public_url = payload.get("photoDataUrl") or "/api/media/placeholder.webp"
                if photo_key:
                    try:
                        public_url = await storage_service.promote_to_public(photo_key)
                    except Exception:
                        pass

                photo = Photo(
                    mandal_id=target_mandal.id,
                    storage_key=photo_key or f"public_{uuid.uuid4().hex[:10]}",
                    public_url=public_url,
                    caption=payload.get("caption"),
                    contributor_name=payload.get("contributorName") or "Devotee",
                    moderation_status="approved",
                )
                session.add(photo)

    await session.commit()

    return {
        "success": True,
        "submissionId": str(submission.id),
        "status": new_status,
        "message": f"Submission successfully {new_status}.",
    }
