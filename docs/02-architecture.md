# System Architecture & Technical Design

## Document Details

- **Project:** BappaMap Mumbai
- **System Classification:** Read-heavy, spiky-traffic geospatial web application
- **Edge Runtime:** Cloudflare Edge Network / Cloudflare Pages & Workers
- **Database:** Supabase PostgreSQL 15+ with PostGIS extension
- **Storage:** Cloudflare R2 Object Storage (S3-compatible, zero egress fees)
- **Status:** Approved Architecture

---

## 1. System Overview & Architectural Diagram

BappaMap Mumbai is architected as an edge-first static and serverless system designed to handle severe 10-day traffic spikes without degrading performance or exceeding cloud free-tier allocations.

```mermaid
flowchart TD
    subgraph Client["Devotee Mobile / Desktop Client"]
        Browser["Mobile Web Browser"]
        MapEngine["MapLibre GL JS (Vector Tile Engine)"]
        CanvasProcessor["HTML5 Canvas (EXIF/GPS Stripping & WebP Encoder)"]
        TurnstileWidget["Cloudflare Turnstile (Bot Check)"]
    end

    subgraph EdgeCDN["Cloudflare Edge Network (BOM / Global Colos)"]
        EdgeCache["Cloudflare Cache / Pages Static Hosting"]
        WAF["WAF Rate Limiting & Bot Protection"]
        WorkerRouter["Cloudflare Worker API Router"]
    end

    subgraph StorageLayer["Data & Object Storage"]
        R2Quarantine["Cloudflare R2 (Quarantine Bucket - Photos)"]
        R2Public["Cloudflare R2 (Public CDN Bucket - Photos)"]
        R2PMTiles["Cloudflare R2 (South Mumbai PMTiles Archive)"]
        SupabaseDB[("Supabase PostgreSQL + PostGIS")]
    end

    subgraph AdminPortal["Moderation & Management"]
        AdminUI["Moderation Dashboard (Auth Protected)"]
        SupabaseAuth["Supabase Auth (JWT & Magic Link)"]
    end

    %% Client Interactions
    Browser -->|1. Fetch HTML/JS/CSS (Cached)| EdgeCache
    Browser -->|2. Request Vector Tiles| R2PMTiles
    Browser -->|3. Get Mandal GeoJSON (Cache TTL 5m)| EdgeCache
    EdgeCache -.->|Cache Miss| WorkerRouter
    WorkerRouter -->|Read Query| SupabaseDB

    %% UGC Submission Flow
    Browser -->|4. Strip Metadata in Browser| CanvasProcessor
    CanvasProcessor -->|5. Upload Quarantined Photo| WorkerRouter
    TurnstileWidget -->|6. Verify Token| WorkerRouter
    WorkerRouter -->|7. Put Object (Private)| R2Quarantine
    WorkerRouter -->|8. Insert Submission (status: pending)| SupabaseDB

    %% Moderation Flow
    AdminUI -->|9. Authenticate| SupabaseAuth
    AdminUI -->|10. Review Pending Queue| WorkerRouter
    WorkerRouter -->|11. Move Photo to Public & Update Status| R2Public
    WorkerRouter -->|12. Set status: published| SupabaseDB
```

---

## 2. Request & Data Flows

### 2.1 Public Read Flow (95% of Traffic)

1. Devotee visits `bappamap.in`. Cloudflare Edge intercepts the request and serves pre-rendered HTML, CSS, and client JavaScript from the closest edge point-of-presence (e.g. BOM - Mumbai).
2. The client runtime initializes MapLibre GL JS. Vector tiles for South Mumbai are fetched directly from Cloudflare R2 (or OpenFreeMap during initial MVP development) via HTTP Range Requests.
3. The client fetches the published mandal collection via `/api/mandals`.
    - **Edge Caching Strategy:** The response is cached at the Cloudflare edge for 300 seconds (`Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400`).
    - If 100,000 visitors view the map concurrently, only a negligible handful of read queries reach PostgreSQL.

### 2.2 User-Generated Content Submission Flow (5% of Traffic)

1. Contributor opens the "Add/Review Mandal" modal.
2. Contributor fills out details (review, crowd status, or new mandal coordinates).
3. If an image is attached:
    - The browser's HTML5 Canvas reads the raw image file.
    - Canvas resizes the image (max 1600px dimension), re-encodes it as `image/webp` (0.8 quality), and completely strips EXIF metadata (including GPS coordinates and camera serials).
4. Cloudflare Turnstile executes an invisible bot assessment and issues a challenge token.
5. The client submits a multipart request containing payload, Turnstile token, and processed WebP image to `/api/submissions`.
6. The API endpoint verifies the Turnstile token with Cloudflare's siteverify API.
7. If verified, the image is written to the private R2 quarantine bucket (`r2://bappamap-quarantine/`).
8. A record is inserted into the PostgreSQL database with `moderation_status = 'pending'`.
9. The client receives an immediate `202 Accepted` confirmation with a user-friendly pending notice.

### 2.3 Moderation Flow

1. Maintainer logs in via `/admin` using Supabase Auth (magic link / email OTP).
2. Dashboard queries `SELECT * FROM submissions WHERE moderation_status = 'pending'`.
3. Admin approves, edits, or rejects the submission.
4. On approval:
    - If a photo was submitted, an edge worker copies the object from `bappamap-quarantine` to `bappamap-public` and marks the DB record as `published`.
    - Cache tag `mandals-list` is purged via Cloudflare API.

---

## 3. High-Traffic Spike Strategy

South Mumbai Ganeshotsav experiences sharp traffic spikes over the 10-day period. The architecture implements four specific layers of defense:

1. **Static First Architecture:** Core page shell and critical CSS are 100% static. No server-side rendering (SSR) is executed for standard page hits.
2. **Aggressive Micro-Caching:**
    - Mandal GeoJSON endpoints use `s-maxage=300, stale-while-revalidate=86400`. During extreme traffic spikes, the edge serves stale cache data if the backend database experiences connection pressure.
3. **Bandwidth Decoupling via R2:** All images and vector tiles are served from Cloudflare R2. Because R2 has **zero egress charges**, an unexpected viral spike of 1M photo impressions will incur $0 in bandwidth costs.
4. **Rate Limiting & Abuse Throttling:** Cloudflare WAF and API route middleware throttle write endpoints (`/api/submissions`) to **5 requests per minute per IP address**.

---

## 4. Environment Architecture

| Environment           | Purpose                                                | Hosting & Infrastructure                                             | Database                                                                 |
| :-------------------- | :----------------------------------------------------- | :------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Local Development** | Developer workstation, rapid iteration, TDD unit tests | Next.js dev server (`localhost:3000`), local SQLite / Docker PostGIS | Local PostgreSQL 15 with PostGIS or mocked fixtures                      |
| **Preview / Staging** | Automated pull request previews, Playwright E2E tests  | Cloudflare Pages Preview / Vercel Preview branch deployments         | Supabase Staging Project (clean ephemeral seed)                          |
| **Production**        | Live public production service                         | Cloudflare Pages Production (`bappamap.in`) with custom domain       | Supabase Production PostgreSQL with connection pooler (Transaction mode) |

---

## 5. Security & Geolocation Guarantee

- **Zero Geolocation Ingestion:** The client code has no references to `navigator.geolocation`. Automated CI linting strictly rejects any pull request containing `geolocation` calls.
- **Content Security Policy (CSP):** Strict CSP headers implemented at the edge block any script injection, camera/microphone access, and unapproved external network requests.
- **CORS Policy:** `/api/*` endpoints restrict allowed origins to `bappamap.in` and preview branch URLs.

---

## 6. Document Cross-References

- [01-PRD.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/01-PRD.md) — Product vision and requirements.
- [03-database-schema.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/03-database-schema.md) — Relational and spatial database structures.
- [04-backend-prd.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/04-backend-prd.md) — API endpoints, rate limiting, and Turnstile integration.
- [08-trust-and-safety.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/08-trust-and-safety.md) — Moderation engine and quarantine lifecycle.
