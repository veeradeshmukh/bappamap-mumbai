# System Architecture & Technical Design

## Document Details

- **Project:** BappaMap Mumbai
- **System Classification:** Read-heavy, spiky-traffic geospatial web application with real-time event streaming
- **Frontend Layer:** Next.js 15 (App Router, Static First) with MapLibre GL JS
- **Backend Layer:** FastAPI (Python 3.12, asyncio, Pydantic v2, SQLAlchemy 2.0 asyncpg)
- **Database:** PostgreSQL 15+ with PostGIS 3.3+ spatial extension
- **Storage:** Dual-tier Quarantine/Public storage abstraction (Local directory / Cloudflare R2 S3-compatible)
- **Real-Time Streaming:** Server-Sent Events (SSE) via `sse-starlette`
- **Status:** Approved Architecture (Revamped & Verified)

---

## 1. System Overview & Architectural Diagram

BappaMap Mumbai is architected as a resilient, edge-first hybrid system designed to handle severe 10-day traffic spikes during Mumbai's Ganeshotsav festival without degrading performance or losing consistency across concurrent visitors.

```mermaid
flowchart TD
    subgraph Client["Devotee Mobile / Desktop Client"]
        Browser["Mobile Web Browser"]
        MapEngine["MapLibre GL JS (Vector Tile Engine)"]
        CanvasProcessor["HTML5 Canvas (EXIF/GPS Stripping & WebP Encoder)"]
        TurnstileWidget["Cloudflare Turnstile (Bot Check)"]
        SSEListener["EventSource Client (/api/events)"]
    end

    subgraph FrontendEdge["Next.js Application Layer"]
        PageRouter["App Router (Static Shell & ISR)"]
        APIRewriter["Edge API Proxy / Rewriter (/api/*)"]
    end

    subgraph BackendService["FastAPI Asynchronous ASGI Backend"]
        FastAPIRouter["API Router & Pydantic Validation"]
        AuthModule["Argon2 Timing-Safe Admin Auth"]
        DecayService["Queue-Aware Crowd Decay Engine"]
        TransliterateEngine["Marathi Phonetic Transliteration Engine"]
        BroadcasterHub["Async SSE Broadcaster Hub"]
        StorageService["Photo Storage Manager (Quarantine/Public)"]
    end

    subgraph StorageLayer["Data & Object Storage"]
        DiskQuarantine["Quarantine Storage (Private Uploads / R2)"]
        DiskPublic["Public CDN Storage (Approved Photos / R2)"]
        OpenFreeMapTiles["OpenFreeMap Vector Tiles CDN"]
        PostgresDB[("PostgreSQL 16 + PostGIS 3.6")]
    end

    subgraph AdminPortal["Moderation Portal (/admin)"]
        AdminUI["Moderation Dashboard"]
        AuditLog["Immutable Audit Trail (moderation_events)"]
    end

    %% Client Interactions
    Browser -->|1. Fetch HTML/JS/CSS| PageRouter
    MapEngine -->|2. Request Vector Tiles| OpenFreeMapTiles
    Browser -->|3. Query Mandals (/api/mandals)| APIRewriter
    APIRewriter -->|Forward Query| FastAPIRouter
    FastAPIRouter -->|Spatial GiST Query| PostgresDB

    %% Real-time SSE
    SSEListener <-->|Live Stream (/api/events)| BroadcasterHub

    %% UGC Submission Flow
    Browser -->|4. Strip EXIF in Browser| CanvasProcessor
    CanvasProcessor -->|5. Upload Sanitized WebP| FastAPIRouter
    TurnstileWidget -->|6. Verify Token| FastAPIRouter
    FastAPIRouter -->|7. Put File| DiskQuarantine
    FastAPIRouter -->|8. Insert Submission (status: pending)| PostgresDB

    %% Moderation Flow
    AdminUI -->|9. Authenticate Session (Argon2)| AuthModule
    AdminUI -->|10. Approve/Reject Submission| FastAPIRouter
    FastAPIRouter -->|11. Promote Photo| StorageService
    StorageService -->|Move File| DiskPublic
    FastAPIRouter -->|12. Log Action & Update Status| PostgresDB
    FastAPIRouter -->|13. Broadcast Live Event| BroadcasterHub
    BroadcasterHub -->|Push to Connected Clients| SSEListener
```

---

## 2. Request & Data Flows

### 2.1 Public Read Flow (95% of Traffic)

1. Devotee visits `bappamap.in`. Pre-rendered HTML, critical CSS, and client JavaScript are served immediately.
2. The client runtime initializes MapLibre GL JS with custom dark basalt styling. Vector tiles for South Mumbai are streamed directly from OpenFreeMap or Cloudflare R2 PMTiles via HTTP Range Requests.
3. The client fetches the published mandal collection via `/api/mandals`.
    - **Edge & Database Performance:** Bounded bounding box queries (`ST_MakeEnvelope`) and spatial radius searches (`ST_DWithin`) utilize PostGIS GiST indexes on `location`.
    - Responses include aggregated star ratings, review counts, verified photos, and live crowd tiers.

### 2.2 Live Real-Time Event Streaming (SSE Flow)

1. When the client loads the interactive directory (`MandalExplorer.tsx`), it opens an `EventSource` connection to `/api/events`.
2. The backend maintains an asynchronous channel pool via `BroadcasterHub`.
3. When an administrator approves a community submission, a photo, or when a crowd decay shift occurs:
    - Backend executes `broadcaster.publish({ type: "mandal_approved" | "photo_approved" | "review_approved" | "crowd_decay_updated", payload })`.
    - The client receives the event and updates active React state and map markers in real time without requiring a page reload.

### 2.3 User-Generated Content Submission Flow (5% of Traffic)

1. Contributor opens the "Add/Review Mandal" modal.
2. Contributor fills out details (suggesting a new mandal, posting a darshan review, or uploading a photo).
3. If Roman English name is entered in the suggestion modal:
    - Debounced request queries `/api/transliterate`.
    - Transliteration engine returns authentic Devanagari Marathi with suffix parsing (`-cha` $\to$ चा, `-chi` $\to$ ची).
4. If an image is attached:
    - The browser HTML5 Canvas resizes the image (max 1600px dimension), re-encodes it as `image/webp` (0.8 quality), and permanently strips EXIF metadata (GPS tags, camera serials, timestamps).
5. Cloudflare Turnstile executes an invisible bot assessment and issues a challenge token.
6. The client submits the request to `/api/submissions`.
7. The API verifies the Turnstile token, checks honeypot invariants, and validates bounding box constraints.
8. If an image is included, it is written to the private quarantine storage partition (`uploads/quarantine/` or R2 quarantine bucket).
9. A record is inserted into PostgreSQL with `moderation_status = 'pending'`.
10. The client receives an immediate `202 Accepted` confirmation with a user-friendly pending notice.

### 2.4 Pre-Moderation & Media Promotion Flow

1. Maintainer authenticates at `/admin/login` using Argon2-verified session credentials.
2. Dashboard queries `SELECT * FROM submissions WHERE moderation_status = 'pending'`.
3. Admin inspects the content and clicks "Approve" or "Reject".
4. On approval:
    - If a photo was submitted, the storage manager atomically moves the file from quarantine to the public directory/bucket (`uploads/public/` or R2 public bucket).
    - A corresponding record in `photos` or `mandals` is inserted/updated to `published`.
    - An immutable audit log entry is written to `moderation_events`.
    - The `BroadcasterHub` publishes an SSE notification to all active clients.

---

## 3. High-Traffic Spike Strategy

South Mumbai Ganeshotsav experiences sharp traffic spikes over the 10-day period. The architecture implements four specific layers of defense:

1. **Static First Shell:** Core page shell and critical CSS are static, eliminating server overhead for base page rendering.
2. **PostGIS GiST Indexing & Async Connection Pooling:** FastAPI leverages `asyncpg` with transaction pooling to handle thousands of concurrent queries without connection starvation.
3. **Bandwidth Decoupling via R2 / OpenFreeMap:** Vector tiles and approved photos are offloaded to zero-egress CDN storage, ensuring zero bandwidth cost overruns during viral spikes.
4. **DPDP Salted IP Rate Limiting:** All write routes (`/api/submissions`, `/api/crowd/report`) are throttled to 5 requests per 10-minute window per salted IP hash, preventing abuse while fully complying with Indian data protection laws.

---

## 4. Environment Architecture

| Environment | Purpose | Hosting & Infrastructure | Database |
| :--- | :--- | :--- | :--- |
| **Local Development** | Developer workstation, rapid iteration, TDD unit tests | Next.js dev server (`localhost:3000`), FastAPI dev server (`localhost:8000`) | Native PostgreSQL 16 + PostGIS 3.6 or Docker PostGIS |
| **Preview / Staging** | Automated pull request previews, Playwright E2E tests | Cloudflare Pages / Vercel Preview branch deployments | Supabase Staging Project (clean ephemeral seed) |
| **Production** | Live public production service | Cloudflare Pages / Container edge hosting (`bappamap.in`) | Production PostgreSQL 16 with PostGIS and connection pooler |

---

## 5. Security & Geolocation Guarantee

- **Zero Geolocation Ingestion:** The client code has no references to `navigator.geolocation`. Automated CI linting strictly rejects any pull request containing `geolocation` calls.
- **Content Security Policy (CSP):** Strict CSP headers implemented at the edge block any script injection, camera/microphone access, and unapproved external network requests.
- **CORS Policy:** `/api/*` endpoints restrict allowed origins to `bappamap.in` and preview branch URLs.

---

## 6. Document Cross-References

- [01-PRD.md](docs/01-PRD.md) — Product vision and requirements.
- [03-database-schema.md](docs/03-database-schema.md) — Relational and spatial database structures.
- [04-backend-prd.md](docs/04-backend-prd.md) — API endpoints, rate limiting, and Turnstile integration.
- [08-trust-and-safety.md](docs/08-trust-and-safety.md) — Moderation engine and quarantine lifecycle.
- [decisions/0007-fastapi-postgres-backend.md](docs/decisions/0007-fastapi-postgres-backend.md) — Architectural decision record for FastAPI and PostGIS.

