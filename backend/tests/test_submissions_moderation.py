import httpx
import pytest


@pytest.mark.asyncio
async def test_submission_honeypot_rejection(client: httpx.AsyncClient):
    payload = {
        "submissionType": "review",
        "mandalSlug": "lalbaugcha-raja",
        "turnstileToken": "1x00000000000000000000AA",
        "honeypot": "spambot-payload",
    }
    res = await client.post("/api/submissions", json=payload)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_submission_turnstile_rejection(client: httpx.AsyncClient):
    payload = {
        "submissionType": "review",
        "mandalSlug": "lalbaugcha-raja",
        "turnstileToken": "2x00000000000000000000AB",  # Deterministic Cloudflare fail token
    }
    res = await client.post("/api/submissions", json=payload)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_submission_bounds_rejection(client: httpx.AsyncClient):
    # Invariant 2: Bounding box must reject outside South Mumbai
    payload = {
        "submissionType": "new_mandal",
        "turnstileToken": "1x00000000000000000000AA",
        "nameEn": "Thane Mandal",
        "localityEn": "Thane",
        "latitude": 19.218,  # Thane (outside South Mumbai bounds)
        "longitude": 72.978,
    }
    res = await client.post("/api/submissions", json=payload)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_full_submission_quarantine_to_moderation_flow(client: httpx.AsyncClient, admin_cookies):
    # 1. Devotee submits a new mandal in Girgaon
    sub_payload = {
        "submissionType": "new_mandal",
        "turnstileToken": "1x00000000000000000000AA",
        "nameEn": "Sikka Nagar Sarvajanik Ganeshotsav",
        "nameMr": "सिक्का नगर सार्वजनिक गणेशोत्सव",
        "localityEn": "Girgaon",
        "localityMr": "गिरगाव",
        "latitude": 18.9572,
        "longitude": 72.8205,
        "descriptionEn": "Peaceful neighborhood mandal in Sikka Nagar chawl.",
    }
    res = await client.post("/api/submissions", json=sub_payload)
    assert res.status_code == 202
    sub_id = res.json()["submissionId"]

    # 2. Moderation queue shows pending submission
    queue_res = await client.get("/api/submissions?status=pending", cookies=admin_cookies)
    assert queue_res.status_code == 200
    pending_ids = [s["id"] for s in queue_res.json()["submissions"]]
    assert sub_id in pending_ids

    # 3. Moderator approves submission
    mod_res = await client.patch(
        f"/api/submissions/{sub_id}",
        json={"action": "approve", "notes": "Verified local mandal in Sikka Nagar."},
        cookies=admin_cookies,
    )
    assert mod_res.status_code == 200
    assert mod_res.json()["status"] == "approved"

    # 4. Mandal is now live on the map!
    mandals_res = await client.get("/api/mandals")
    assert mandals_res.status_code == 200
    mandals_data = mandals_res.json()
    slugs = [m["slug"] for m in mandals_data]
    assert any("sikka-nagar" in s for s in slugs)
