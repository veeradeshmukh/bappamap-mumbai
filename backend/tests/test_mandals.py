import httpx
import pytest


@pytest.mark.asyncio
async def test_get_mandals_list(client: httpx.AsyncClient):
    res = await client.get("/api/mandals")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 12

    # Verify bilingual fields & queue crowds
    first = data[0]
    assert "nameEn" in first
    assert "nameMr" in first
    assert "localityEn" in first
    assert "localityMr" in first
    assert "latitude" in first
    assert "longitude" in first
    assert "mukhDarshanCrowd" in first
    assert "charanSparshCrowd" in first


@pytest.mark.asyncio
async def test_postgis_bbox_filter(client: httpx.AsyncClient):
    # Envelope around Girgaon only
    res = await client.get("/api/mandals?bbox=72.81,18.94,72.83,18.97")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    # Every returned mandal must fall within the requested bounding box
    for m in data:
        assert 72.81 <= m["longitude"] <= 72.83
        assert 18.94 <= m["latitude"] <= 18.97


@pytest.mark.asyncio
async def test_postgis_nearby_filter(client: httpx.AsyncClient):
    # Invariant 1: Nearby user-chosen point (Girgaon Chowpatty area: 72.815, 18.955, radius 1500m)
    res = await client.get("/api/mandals?nearby=72.815,18.955,1500")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    slugs = [m["slug"] for m in data]
    assert "keshavji-naik-chawl" in slugs or "girgaoncha-raja" in slugs


@pytest.mark.asyncio
async def test_mandal_detail(client: httpx.AsyncClient):
    res = await client.get("/api/mandals/lalbaugcha-raja")
    assert res.status_code == 200
    data = res.json()
    assert data["slug"] == "lalbaugcha-raja"
    assert "Lalbaugcha Raja" in data["nameEn"]
    assert "लालबागचा राजा" in data["nameMr"]
