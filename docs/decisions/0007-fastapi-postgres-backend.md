# ADR 0007: FastAPI + PostgreSQL/PostGIS Backend Architecture

## Status

Accepted (Branch `revamp/fastapi-postgres`)

## Context

BappaMap Mumbai originally developed two disjoint backend approaches: an unauthenticated prototype Flask + SQLite service (`app.py`), and fragmented Next.js route handlers (`src/app/api/*`) utilizing in-memory arrays for quarantine submissions, rate limiting, and crowd decay calculations.

Under high-traffic festival conditions:
1. In-memory quarantine stores and rate limiters lose state across multi-instance edge deployments and serverless cold starts.
2. The SQLite database cannot handle concurrent geospatial indexing or concurrent write loads.
3. Lack of spatial queries (`ST_DWithin`, bounding box envelopes) prevented high-performance geographic filtering.
4. Real-time updates required manual browser reloads, degrading devotee experience in congested mobile network environments.

## Decision

We unify the entire backend architecture into a single source of truth:
1. **Runtime & Framework:** Python 3.12 + FastAPI + Pydantic v2 + SQLAlchemy 2.0 (asyncio + asyncpg) + Alembic migrations.
2. **Database:** PostgreSQL 15+ with PostGIS 3.3+ extension, storing spatial coordinates as `geography(Point, 4326)` with native GiST spatial indexes.
3. **Frontend Integration:** Next.js proxies `/api/*` to FastAPI via rewrites in `next.config.mjs`, maintaining strict Content Security Policy headers and zero hardcoded localhost URLs.
4. **Real-Time Map Flow:** FastAPI exposes a Server-Sent Events (SSE) streaming endpoint (`/api/events`). When an administrator approves a quarantined mandal or crowd report, an event is broadcast to all connected clients, updating the map and pins live without a page refresh.
5. **Decay Engine & Queue Differentiation:** The linear crowd decay model (2-hour window) is executed server-side, evaluating `mukh_darshan` and `charan_sparsh` queue types separately.
6. **Persistence:** All quarantine submissions, moderation audit events, and DPDP-salted IP rate limit counts are persisted in PostgreSQL tables.

## Consequences

- **Positive:** True production-grade geospatial architecture with zero in-memory state leakage, native PostGIS spatial queries, and live SSE streaming to frontend clients.
- **Positive:** Clean single backend ownership; eliminated duplicate Next.js API routes and SQLite files.
- **Positive:** Strict enforcement of all 8 project invariants (zero geolocation, South Mumbai bounds, EXIF stripping, pre-moderation quarantine, DPDP IP hashing, Cloudflare Turnstile bot defense).
