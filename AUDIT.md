# BappaMap Mumbai — Backend & Codebase Audit (Phase 0)

**Date:** October 12, 2026  
**Branch:** `revamp/fastapi-postgres`  
**Status:** Read-Only Audit Complete — Awaiting User Approval  

---

## 1. Executive Summary & Suspicions Verdict

| Suspected Issue | Audit Finding | Verdict | Evidence / Details |
| :--- | :--- | :---: | :--- |
| **Flask moderation unauthenticated** | Flask `GET /api/submissions` and `PATCH /api/submissions/<id>` in `app.py` have zero auth decorators or token checks. | **CONFIRMED** | Anyone can view private quarantined reports or approve/reject/inject mandals directly into `bappa.db`. |
| **`decay-engine.ts` not wired to real data** | `src/lib/crowd/decay-engine.ts` is imported **only** in `tests/unit/crowd/decay-engine.test.ts`. | **CONFIRMED** | 0 callers in API routes, components, hooks, or backend. The decay math was never wired to live data. |
| **Photo storage (R2) unimplemented** | No R2 / S3 client code exists in `package.json`, Python files, or API routes. | **CONFIRMED** | Stored entirely as Base64 `dataUrl` strings in memory (`quarantineStore`) or raw SQLite text columns. |
| **`seed-mandals.json` count discrepancy** | `data/seed-mandals.json` contains exactly **12** records. | **CONFIRMED** | Some descriptions referenced 11, but the JSON defines 12 verified mandals (Keshavji Naik Chawl through Bal Gopal Mitra Mandal). |
| **Dual overlapping backends** | Both Next.js API routes (`src/app/api/*`) and Flask (`app.py`) exist; frontend hardcodes `http://127.0.0.1:5000`. | **CONFIRMED** | Next.js routes have full Zod/Turnstile validation but in-memory state; Flask has SQLite persistence but zero security. |

---

## 2. Endpoint Audit & Categorization Matrix

### 2.1 Flask Prototype Endpoints (`app.py`)

| Endpoint | Method | Current Auth | Target Action | Callers / Evidence |
| :--- | :---: | :---: | :---: | :--- |
| `/api/mandals` | `GET` | None | **PORT-TO-BACKEND** | Called by `src/app/page.tsx`, `MandalExplorer.tsx`. Port to FastAPI with PostGIS queries. |
| `/api/submissions` | `POST` | None | **PORT-TO-BACKEND** | Called by `SuggestMandalForm.tsx`, `ReviewMandalForm.tsx`, `UploadPhotoForm.tsx`. Port to FastAPI with Turnstile & Pydantic validation. |
| `/api/submissions` | `GET` | **None (Vulnerability)** | **DELETE (from Flask)** | Called by `src/app/admin/page.tsx`. Replace with authenticated `/api/admin/moderation/queue`. |
| `/api/submissions/<id>` | `PATCH` | **None (Vulnerability)** | **DELETE (from Flask)** | Called by `src/app/admin/page.tsx`. Replace with authenticated `/api/admin/moderation/{id}`. |
| `app.py` & `init_db.py` | — | — | **DELETE** | Temporary prototype scripts to be purged in Phase 4. |

### 2.2 Next.js API Routes (`src/app/api/`)

| Route Path | Method | Current Auth | Target Action | Callers / Evidence |
| :--- | :---: | :---: | :---: | :--- |
| `src/app/api/submissions/route.ts` | `POST` | Public + Turnstile + RateLimit | **PORT-TO-BACKEND & DELETE** | Logic (Turnstile, IP hash, bounds check, quarantine) ports to FastAPI. Route deleted from Next.js. |
| `src/app/api/admin/auth/login/route.ts` | `POST` | Password comparison | **PORT-TO-BACKEND & DELETE** | Port argon2/HMAC session login to FastAPI. Route deleted from Next.js. |
| `src/app/api/admin/auth/logout/route.ts` | `POST` | Cookie invalidation | **PORT-TO-BACKEND & DELETE** | Port logout to FastAPI. Route deleted from Next.js. |
| `src/app/api/admin/moderation/queue/route.ts` | `GET` | Admin session required | **PORT-TO-BACKEND & DELETE** | Port to FastAPI backed by PostgreSQL `submissions` table. Route deleted from Next.js. |
| `src/app/api/admin/moderation/[id]/route.ts` | `PATCH` | Admin session required | **PORT-TO-BACKEND & DELETE** | Port to FastAPI with transactional promotion to `mandals` table. Route deleted from Next.js. |

---

## 3. Module & Store Categorization Matrix

| Module / File | Current Role | Categorization | Destination & Action | Evidence / Callers |
| :--- | :--- | :---: | :--- | :--- |
| `src/lib/crowd/decay-engine.ts` | Linear crowd decay model | **PORT-TO-BACKEND & DELETE** | Port to `backend/app/services/crowd_service.py`; delete from Next.js. | Only tested in `tests/unit/crowd/decay-engine.test.ts`. 0 runtime callers. |
| `src/lib/security/rate-limit.ts` | In-memory IP rate limiter | **PORT-TO-BACKEND & DELETE** | Port to FastAPI middleware/service with Postgres persistence; delete from Next.js. | Only called in `src/app/api/submissions/route.ts`. |
| `src/lib/security/turnstile.ts` | Cloudflare siteverify client | **PORT-TO-BACKEND & DELETE** | Port to `backend/app/services/turnstile.py`; delete from Next.js. | Only called in `src/app/api/submissions/route.ts`. Server secret must not leak. |
| `src/lib/auth/admin-auth.ts` | HMAC cookie token auth | **PORT-TO-BACKEND & DELETE** | Port to FastAPI `backend/app/core/auth.py` with argon2; delete from Next.js. | Only called in `src/app/api/admin/*`. |
| `src/lib/submissions/quarantine-store.ts` | In-memory mock store | **PORT-TO-BACKEND & DELETE** | Port to PostgreSQL `submissions` table via SQLAlchemy; delete from Next.js. | Volatile `globalThis` store; only called in Next.js API routes. |
| `src/lib/submissions/schemas.ts` | Zod validation schemas | **PORT-TO-BACKEND & DELETE** | Port to Pydantic v2 schemas (`backend/app/schemas/`); delete from Next.js. | Only called in Next.js API routes. |
| `src/lib/media/canvas-processor.ts` | Client-side EXIF stripper | **KEEP** | Stays in Next.js (`src/lib/media/`) | Called by `UploadPhotoForm.tsx`. Invariant #4: client-side EXIF decoupling. |
| `src/lib/filters/engine.ts` & `definitions.ts` | Client filter & URL sync | **KEEP** | Stays in Next.js (`src/lib/filters/`) | Core UI instant search and filter state for `MandalExplorer` and `FilterBar`. |
| `src/lib/geo/bounds.ts` & `google-maps.ts` | Bounds & deep links | **KEEP** | Stays in Next.js (`src/lib/geo/`); bounds mirrored in backend | MapLibre camera clamping and universal external Google Maps links. |
| `src/lib/i18n/translations.ts` | Bilingual dictionary | **KEEP** | Stays in Next.js (`src/lib/i18n/`) | Client UI string translations in English and Marathi. |
| `src/lib/map/theme.ts` | MapLibre vector styles | **KEEP** | Stays in Next.js (`src/lib/map/`) | Basalt Dark and Coastal Light vector style specs. |
| `src/lib/data/mandals.ts` | Seed data loader | **KEEP** | Stays in Next.js (`src/lib/data/`) | Offline / cold-start fallback when backend is unreachable during render. |
| `data/seed-mandals.json` | 12 seed mandals fixture | **KEEP** | Canonical fixture for database seeder and tests | Used by seeder and frontend fallback. |
| `migrations/0001_initial_schema.sql` | PostGIS reference DDL | **PORT-TO-BACKEND** | Reconciled into Alembic migrations | Canonical PostGIS schema blueprint. |
| `bappa.db` & `venv/` | Local SQLite prototype | **DELETE** | Remove from repo root | Replaced by Docker Compose PostgreSQL/PostGIS. |

---

## 4. Proposed Execution Plan (Phases 1–6)

### Phase 1: Target Architecture Setup
- **FastAPI Backend Structure:** Initialize `backend/` using `uv` with Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 (asyncio + asyncpg), Alembic, and `httpx`.
- **Docker Compose:** Multi-service `docker-compose.yml` defining PostgreSQL 15 + PostGIS (`postgis/postgis:15-3.3`), exposing port 5432, plus MinIO/local storage container for local photo emulation.
- **Next.js Single Gateway Proxy:** Configure `next.config.mjs` with `rewrites()` pointing `/api/:path*` to `http://127.0.0.1:8000/api/:path*`. Remove hardcoded `http://127.0.0.1:5000` from all components; all client calls become clean, relative `/api/*`.
- **OpenAPI TypeScript Types:** Auto-generate frontend types from FastAPI's OpenAPI schema (`openapi-typescript`).

### Phase 2: Database & Alembic Migrations
- Reconcile `migrations/0001_initial_schema.sql` into Alembic version 1.
- Models: `Mandal` (with PostGIS `Geometry(Point, 4326)` or `Geography`, bilingual names/descriptions), `MandalAttribute`, `Submission` (`new_mandal`, `review`, `photo`), `Review`, `CrowdReport` (with `queue_type`: `mukh_darshan` | `charan_sparsh`), `Photo`, `ModerationEvent` (audit trail), and `RateLimit`.
- Idempotent seed script reading `data/seed-mandals.json` (inserting all 12 verified mandals).

### Phase 3: The Product Flow (Beyond CRUD)
- **Flow 1 (Submission & Moderation Loop):** Community submit -> quarantined as `pending` -> moderator reviews via authenticated dashboard -> on approval, automatically promoted to `mandals`/`reviews`/`photos`.
- **Flow 2 (Live Crowd Intelligence):** Server-side decay engine ported from TypeScript (`decay_service.py`), calculating time-weighted crowd tier, score, and confidence over a 2-hour window per `queue_type`.
- **Flow 3 (Real-Time SSE):** Server-Sent Events endpoint `/api/events` broadcasting `mandal_approved` and `crowd_updated` events. Next.js map pins and cards update live without manual reload.
- **Flow 4 (Spatial Queries):** `/api/mandals?bbox=minLng,minLat,maxLng,maxLat` and `/api/mandals/nearby?lat=...&lng=...&radius=...` using PostGIS `ST_Within` and `ST_DWithin`.
- **Flow 5 (Darshan-Aware Crowd):** Distinct display of *Mukh Darshan* vs *Charan Sparsh* wait/crowd status in mandal cards and popups.
- **Stretch Items:** Multi-mandal walking route generator; stale-while-revalidate offline indicator.

### Phase 4: Dead-Code Purge
- Purge `app.py`, `init_db.py`, `bappa.db`, `src/app/api/*`, obsolete server-side libraries in `src/lib/`.
- Run `knip` / `tsc --noEmit` and `ruff` to ensure 0 orphaned exports or broken imports.
- Record before/after metrics (files, LOC, dependencies).

### Phase 5: Verification & Flagship E2E Test
- Backend tests: `pytest` + `testcontainers` or Docker Compose Postgres (0 mocked queries).
- Flagship E2E Playwright test: Submit new mandal -> approve in moderator portal -> live SSE updates map -> submit crowd report -> pin badge transitions live.
- All gates pass: `ruff`, `mypy`/`pyright`, `pytest`, `tsc --noEmit`, `eslint`, `vitest`, `playwright`.

### Phase 6: MVP Hardening
- `.env.example`, `/health` endpoint, Dockerfile for FastAPI, Windows PowerShell run guide.
- New ADR 0007 (`docs/decisions/0007-fastapi-postgres-backend.md`).

---

## 5. Non-Negotiable Invariants Checklist

- [x] **Invariant 1 (Zero Geolocation):** `navigator.geolocation` remains banned; `geolocation-ban.test.ts` passes.
- [x] **Invariant 2 (South Mumbai Bounds):** Hard bounds `[72.78, 18.89]` to `[72.87, 19.015]` enforced on MapLibre and validated in FastAPI Pydantic schemas.
- [x] **Invariant 3 (No Paid Map APIs):** MapLibre GL JS + OpenFreeMap tiles only.
- [x] **Invariant 4 (Client EXIF Stripping):** HTML5 Canvas in `canvas-processor.ts` strips all metadata before upload.
- [x] **Invariant 5 (Pre-Moderation Quarantine):** All UGC stored with `status = 'pending'`; zero unmoderated content exposed on public endpoints.
- [x] **Invariant 6 (DPDP IP Hashing):** Raw IPs hashed with HMAC-SHA256 salt; raw IPs never logged or stored.
- [x] **Invariant 7 (Turnstile + Honeypot):** Cloudflare Turnstile token verified server-side; honeypots silent-dropped.
- [x] **Invariant 8 (Bilingual Foundation):** English and Marathi preserved across all models, DDL, and API schemas.
