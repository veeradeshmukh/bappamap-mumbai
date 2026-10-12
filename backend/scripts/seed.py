import asyncio
import json
import sys
from pathlib import Path

from geoalchemy2.elements import WKTElement
from sqlalchemy import delete, select

# Ensure project root is on path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.core.security import hash_client_ip
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.crowd_report import CrowdReport
from backend.app.models.mandal import Mandal, MandalAttribute
from backend.app.models.moderation_event import ModerationEvent
from backend.app.models.submission import Submission


async def seed_data():
    seed_file = REPO_ROOT / "data" / "seed-mandals.json"
    if not seed_file.exists():
        print(f"Error: Seed file {seed_file} does not exist.")
        return

    with open(seed_file, encoding="utf-8") as f:
        data = json.load(f)

    print(f"Found {len(data)} mandals in {seed_file}")

    async with AsyncSessionLocal() as session:
        valid_slugs = {item["slug"] for item in data}
        extra_res = await session.execute(select(Mandal).where(Mandal.slug.not_in(valid_slugs)))
        for em in extra_res.scalars().all():
            print(f"Removing non-seed mandal: {em.slug}")
            await session.delete(em)

        await session.execute(delete(Submission))
        await session.execute(delete(ModerationEvent))
        await session.commit()

        for item in data:
            slug = item["slug"]
            stmt = select(Mandal).where(Mandal.slug == slug)
            res = await session.execute(stmt)
            mandal = res.scalars().first()

            point_geom = WKTElement(f"POINT({item['longitude']} {item['latitude']})", srid=4326)

            if not mandal:
                mandal = Mandal(
                    slug=slug,
                    name_en=item["nameEn"],
                    name_mr=item["nameMr"],
                    locality_en=item["localityEn"],
                    locality_mr=item["localityMr"],
                    bmc_ward=item.get("bmcWard", "D"),
                    founded_year=item.get("foundedYear"),
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    location=point_geom,
                    google_place_id=item.get("googlePlaceId"),
                    description_en=item.get("descriptionEn"),
                    description_mr=item.get("descriptionMr"),
                    current_crowd_level="moderate",
                    avg_rating=4.85,
                    review_count=12,
                    metadata_json=item.get("attributes", {}),
                    is_active=True,
                )
                session.add(mandal)
                await session.flush()
                print(f"Created mandal: {mandal.name_en} ({slug})")
            else:
                mandal.name_en = item["nameEn"]
                mandal.name_mr = item["nameMr"]
                mandal.locality_en = item["localityEn"]
                mandal.locality_mr = item["localityMr"]
                mandal.bmc_ward = item.get("bmcWard", "D")
                mandal.founded_year = item.get("foundedYear")
                mandal.latitude = item["latitude"]
                mandal.longitude = item["longitude"]
                mandal.location = point_geom
                mandal.description_en = item.get("descriptionEn")
                mandal.description_mr = item.get("descriptionMr")
                mandal.metadata_json = item.get("attributes", {})
                print(f"Updated mandal: {mandal.name_en} ({slug})")

            # Attributes
            if "attributes" in item:
                for k, v in item["attributes"].items():
                    attr_stmt = select(MandalAttribute).where(
                        MandalAttribute.mandal_id == mandal.id,
                        MandalAttribute.attribute_key == k,
                    )
                    attr_res = await session.execute(attr_stmt)
                    attr = attr_res.scalars().first()
                    if not attr:
                        attr = MandalAttribute(
                            mandal_id=mandal.id,
                            attribute_key=k,
                            attribute_value={"value": v},
                        )
                        session.add(attr)
                    else:
                        attr.attribute_value = {"value": v}

            # Seed a sample crowd report for mukh_darshan and charan_sparsh if none exist
            cr_stmt = select(CrowdReport).where(CrowdReport.mandal_id == mandal.id)
            cr_res = await session.execute(cr_stmt)
            existing_reports = cr_res.scalars().all()
            if not existing_reports:
                report1 = CrowdReport(
                    mandal_id=mandal.id,
                    crowd_level="moderate",
                    queue_type="mukh_darshan",
                    ip_hash=hash_client_ip("127.0.0.1"),
                )
                report2 = CrowdReport(
                    mandal_id=mandal.id,
                    crowd_level="heavy",
                    queue_type="charan_sparsh",
                    ip_hash=hash_client_ip("127.0.0.1"),
                )
                session.add_all([report1, report2])

        await session.commit()
        print("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_data())
