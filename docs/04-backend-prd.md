# Backend Architecture & API Specification

## Document Details

- **Project:** BappaMap Mumbai
- **Service Layer:** FastAPI (Python 3.12, asyncio, asyncpg, SQLAlchemy 2.0)
- **Validation Engine:** Pydantic v2 (Strict Schema Validation)
- **Spatial Engine:** GeoAlchemy2 with PostGIS 3.3+ extension
- **Real-Time Hub:** Server-Sent Events (SSE) via `sse-starlette`
- **Status:** Approved Specification (Production Implementation)

---

## 1. Backend Service Responsibilities

The backend is architected as an asynchronous, high-throughput ASGI service:

1. **Public Read API:** Serves PostGIS-indexed JSON representations of South Mumbai mandals, approved reviews, and photo galleries.
2. **Real-Time Event Streaming (SSE):** Broadcasts administrative approvals (`mandal_approved`, `review_approved`, `photo_approved`) and crowd decay level updates to connected clients without browser polling.
3. **Phonetic Auto-Transliteration Engine:** Translates Roman English input to authentic Devanagari Marathi with cultural lexicon lookups and Marathi possessive suffix grammar parsing (`-cha` $\to$ चा, `-chi` $\to$ ची).
4. **Queue-Differentiated Crowd Decay Aggregator:** Calculates time-weighted moving averages over a 120-minute sliding window separately for **Mukh Darshan** and **Charan Sparsh** queues.
5. **UGC Submission Intake & Pre-Moderation Quarantine:** Receives suggestions, reviews, and WebP photo uploads; validates Turnstile bot tokens and bounding box rules; and quarantees records as `pending`.
6. **Admin Moderation & Media Promotion:** Authenticates moderators via Argon2id timing-safe sessions; atomically moves approved photos from quarantine to public CDN storage; and logs actions to an immutable audit trail.
7. **Privacy-Preserving Rate Limiter:** Enforces token bucket quotas indexed on HMAC-SHA256 salted IP hashes, strictly adhering to the DPDP Act 2023.

---

## 2. API Contract & Endpoints

All error responses adhere to RFC 7807 Problem Details.

### 2.1 Public Endpoints

#### `GET /api/mandals`
Returns all active mandals in South Mumbai with aggregated star ratings, photo previews, and live crowd tiers.

- **Query Parameters:**
  - `crowd` (optional): `low`, `moderate`, `heavy`, `very_heavy`
  - `parking` (optional): `true`, `false`
  - `min_rating` (optional): `1.0` to `5.0`
  - `search` (optional): string query matching English or Marathi name/locality
  - `bbox` (optional): comma-delimited bounding box `minLng,minLat,maxLng,maxLat`
- **Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "slug": "lalbaugcha-raja",
      "name": {
        "en": "Lalbaugcha Raja",
        "mr": "लालबागचा राजा"
      },
      "locality": {
        "en": "Lalbaug",
        "mr": "लालबाग"
      },
      "bmcWard": "F/South",
      "foundedYear": 1934,
      "coordinates": {
        "latitude": 18.99052,
        "longitude": 72.83641
      },
      "currentCrowdLevel": "very_heavy",
      "avgRating": 4.95,
      "reviewCount": 1420,
      "photos": [
        {
          "id": "e2c3d4e5-0000-0000-0000-000000000001",
          "publicUrl": "/uploads/public/photo_lalbaug.webp",
          "caption": "Pandal entrance",
          "contributorName": "Rohan M."
        }
      ],
      "attributes": {
        "parkingNearby": false,
        "darshanTypes": ["mukh_darshan", "navas_charan_sparsh"]
      }
    }
  ],
  "meta": {
    "total": 13
  }
}
```

---

#### `GET /api/mandals/{slug_or_id}`
Returns full record details, approved reviews, photo gallery, and crowd queue breakdown.

- **Success Response (200 OK):**
```json
{
  "data": {
    "id": "a1b2c3d4-0000-0000-0000-000000000001",
    "slug": "lalbaugcha-raja",
    "name": { "en": "Lalbaugcha Raja", "mr": "लालबागचा राजा" },
    "description": {
      "en": "Founded in 1934, Lalbaugcha Raja is the most famous Ganpati mandal in Mumbai...",
      "mr": "१९३४ मध्ये स्थापन झालेला लालबागचा राजा हा मुंबईतील अत्यंत प्रसिद्ध गणपती आहे..."
    },
    "coordinates": { "latitude": 18.99052, "longitude": 72.83641 },
    "currentCrowdLevel": "very_heavy",
    "avgRating": 4.95,
    "reviewCount": 1420,
    "photos": [...],
    "recentReviews": [
      {
        "id": "r1-0001",
        "authorName": "Amit K.",
        "rating": 5,
        "crowdObservation": "heavy",
        "comment": "Mukh darshan line is moving steadily, took 3 hours in morning.",
        "createdAt": "2026-10-12T08:30:00Z"
      }
    ],
    "crowdQueues": {
      "mukhDarshan": "heavy",
      "charanSparsh": "very_heavy",
      "updatedAt": "2026-10-12T09:15:00Z"
    }
  }
}
```

---

#### `GET /api/mandals/{slug_or_id}/photos`
Returns approved photos uploaded by the community for the specific mandal.

- **Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "p1-0001",
      "mandalId": "a1b2c3d4-0000-0000-0000-000000000001",
      "publicUrl": "/uploads/public/photo_6aee0c05f321.webp",
      "caption": "Mandal sanctum sanctorum",
      "contributorName": "Devotee",
      "createdAt": "2026-10-12T10:00:00Z"
    }
  ],
  "meta": { "total": 1 }
}
```

---

#### `POST /api/submissions`
Universal community submission endpoint (accepts `multipart/form-data` or `application/json`).

- **Rate Limit:** 5 requests per 10-minute window per salted IP hash.
- **Payload Types:**
  1. `new_mandal`: `nameEn`, `nameMr`, `localityEn`, `localityMr`, `latitude`, `longitude`, `foundedYear`, `description`
  2. `review`: `mandalId`, `authorName`, `rating`, `crowdObservation`, `comment`
  3. `photo`: `mandalId`, `file` (WebP blob), `caption`, `contributorName`
- **Success Response (202 Accepted):**
```json
{
  "status": "success",
  "message": "Submission received and queued for community moderation.",
  "submissionId": "b3c4d5e6-0000-0000-0000-000000000001"
}
```

---

#### `POST /api/crowd/report`
Fast-path endpoint for devotees reporting queue status on the ground.

- **Request Body:**
```json
{
  "mandalId": "a1b2c3d4-0000-0000-0000-000000000001",
  "crowdLevel": "heavy",
  "queueType": "mukh_darshan",
  "turnstileToken": "0.XXXXX.YYYYY"
}
```
- **Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Crowd report recorded successfully.",
  "updatedCrowdLevel": "heavy"
}
```

---

#### `POST /api/transliterate`
Phonetic Roman-to-Devanagari transliteration engine with local Mumbai Ganeshotsav lexicon and Marathi grammar suffixes.

- **Request Body:**
```json
{
  "text": "Lalbaugcha Raja"
}
```
- **Success Response (200 OK):**
```json
{
  "transliterated": "लालबागचा राजा",
  "confidence": 1.0,
  "source": "dictionary"
}
```

---

#### `GET /api/events`
Server-Sent Events (SSE) streaming endpoint for active clients.

- **Stream Format:** `text/event-stream`
- **Event Types Emitted:**
  - `mandal_approved`: Payload contains approved mandal entity.
  - `photo_approved`: Payload contains mandal ID and approved photo metadata.
  - `review_approved`: Payload contains mandal ID and updated review count/rating.
  - `crowd_decay_updated`: Payload contains mandal ID and recalculate crowd tier.

---

### 2.2 Admin Moderation Endpoints (Protected by Argon2id Session)

#### `POST /api/admin/login`
Authenticates a moderator and issues an HTTP-only secure session cookie.

#### `POST /api/admin/logout`
Invalidates active moderator session.

#### `GET /api/admin/me`
Returns authenticated moderator identity.

#### `GET /api/admin/submissions`
Lists quarantined submissions, filterable by `status` (`pending`, `published`, `flagged`, `rejected`).

#### `POST /api/admin/submissions/{id}/approve`
Approves a quarantined submission:
- Promotes photos from quarantine partition to public CDN storage.
- Inserts or updates live database entities (`mandals`, `reviews`, `photos`).
- Emits real-time SSE event to all connected clients.
- Records action in `moderation_events` audit table.

#### `POST /api/admin/submissions/{id}/reject`
Rejects a quarantined submission and logs reviewer rationale.

#### `GET /api/admin/audit-logs`
Returns the immutable moderation audit trail (`moderation_events`).

---

## 3. Server-Side Crowd Decay Engine

The crowd level of each mandal decays dynamically based on a weighted 120-minute sliding window:

### 3.1 Decay Weighting Function

Each report $r_i$ submitted $\Delta t$ minutes ago receives a weight $w_i$:
- $\Delta t \le 15$ min: $w_i = 1.00$
- $15 < \Delta t \le 45$ min: $w_i = 0.75$
- $45 < \Delta t \le 90$ min: $w_i = 0.40$
- $90 < \Delta t \le 120$ min: $w_i = 0.15$
- $\Delta t > 120$ min: $w_i = 0.00$ (Discarded)

### 3.2 Discrete Tier Mapping

Crowd tiers are converted to numerical scores:
`low` = 1, `moderate` = 2, `heavy` = 3, `very_heavy` = 4.

The aggregate score is:
$$\bar{S} = \frac{\sum_{i} w_i \cdot S_i}{\sum_{i} w_i}$$

- $\bar{S} < 1.75 \implies \text{low}$
- $1.75 \le \bar{S} < 2.50 \implies \text{moderate}$
- $2.50 \le \bar{S} < 3.25 \implies \text{heavy}$
- $\bar{S} \ge 3.25 \implies \text{very\_heavy}$

Separate aggregate scores are maintained for `mukh_darshan` and `charan_sparsh` queues.

---

## 4. Document Cross-References

- [02-architecture.md](docs/02-architecture.md) — System flow and caching tiers.
- [03-database-schema.md](docs/03-database-schema.md) — Relational models and constraints.
- [08-trust-and-safety.md](docs/08-trust-and-safety.md) — Spam defenses and moderation flow.
- [09-security-and-privacy.md](docs/09-security-and-privacy.md) — Token validation and rate limiting.

