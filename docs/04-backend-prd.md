# Backend Architecture & API Specification

## Document Details

- **Project:** BappaMap Mumbai
- **Service Layer:** Next.js Route Handlers / Cloudflare Workers
- **Database Access:** Typed PostgreSQL Driver / Kysely or Prisma with PostGIS
- **Validation Engine:** Zod (Strict TypeScript Schema Validation)
- **Status:** Approved Specification

---

## 1. Backend Service Responsibilities

The backend is intentionally lean, stateless, and optimized for high-throughput edge execution:

1. **Public Read API:** Serves edge-cacheable JSON representations of South Mumbai mandals and approved reviews.
2. **UGC Submission Ingestion:** Receives reviews, photo uploads, and new mandal suggestions; validates payloads against Zod schemas; validates Cloudflare Turnstile tokens; and stores submissions in `pending` quarantine.
3. **Admin Moderation API:** Provides authenticated endpoints for maintainers to approve, reject, or flag quarantined records.
4. **Crowd Status Sliding-Window Aggregator:** Periodically aggregates raw community crowd reports over a 2-hour decaying window to calculate `current_crowd_level`.

---

## 2. API Contract & Endpoints

All responses follow RFC 7807 Problem Details on errors.

### 2.1 Public Endpoints

#### `GET /api/mandals`

Returns all active mandals in South Mumbai with aggregated ratings and current crowd levels.

- **Cache Header:** `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=86400`
- **Query Parameters:**
    - `crowd` (optional): `low`, `moderate`, `heavy`, `very_heavy`
    - `parking` (optional): `true`, `false`
    - `min_rating` (optional): `1` to `5`
    - `search` (optional): string query matching English or Marathi name
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
                "latitude": 18.9905,
                "longitude": 72.8364
            },
            "currentCrowdLevel": "very_heavy",
            "avgRating": 4.95,
            "reviewCount": 1420,
            "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=18.9905%2C72.8364",
            "attributes": {
                "parkingNearby": false,
                "darshanTypes": ["mukh_darshan", "navas_charan_sparsh"]
            }
        }
    ],
    "meta": {
        "total": 12,
        "cachedAt": "2027-09-05T12:00:00Z"
    }
}
```

---

#### `GET /api/mandals/:slug`

Returns full details, approved reviews, and approved photo URLs for a specific mandal.

- **Cache Header:** `Cache-Control: public, max-age=60, s-maxage=300`
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
        "coordinates": { "latitude": 18.9905, "longitude": 72.8364 },
        "currentCrowdLevel": "very_heavy",
        "photos": [
            {
                "id": "p1-0001",
                "publicUrl": "https://cdn.bappamap.in/photos/lalbaug-2027-01.webp",
                "caption": "Pandal entrance decoration",
                "contributorName": "Rohan M."
            }
        ],
        "recentReviews": [
            {
                "id": "r1-0001",
                "authorName": "Amit K.",
                "rating": 5,
                "crowdObservation": "heavy",
                "comment": "Mukh darshan line is moving steadily, took 3 hours in morning.",
                "createdAt": "2027-09-05T08:30:00Z"
            }
        ]
    }
}
```

---

#### `POST /api/submissions`

Universal intake for community submissions (Reviews, Photo Uploads, New Mandal Suggestions).

- **Rate Limit:** 5 requests per minute per IP.
- **Headers:** `Content-Type: multipart/form-data` or `application/json`
- **Request Body (Review Example):**

```json
{
    "submissionType": "review",
    "mandalId": "a1b2c3d4-0000-0000-0000-000000000001",
    "authorName": "Sunil P.",
    "rating": 5,
    "crowdObservation": "heavy",
    "comment": "Darshan was serene, volunteers managing crowds well.",
    "turnstileToken": "0.XXXXX.YYYYY"
}
```

- **Success Response (202 Accepted):**

```json
{
    "status": "success",
    "message": "Submission received and queued for community moderation.",
    "submissionId": "sub-987654"
}
```

---

### 2.2 Admin Endpoints (Protected by Supabase Auth Session)

#### `GET /api/admin/moderation/queue`

Fetches all pending submissions.

- **Auth:** Requires Bearer JWT with `role: 'moderator'` or `role: 'admin'`.

#### `PATCH /api/admin/moderation/:id`

Updates moderation status.

- **Request Body:**

```json
{
    "action": "approve", // 'approve' | 'reject' | 'flag'
    "reviewerNotes": "Verified photo contains no personal selfies or offensive content."
}
```

- On `action: "approve"`:
    - If photo: Moves object from R2 quarantine to public bucket.
    - Updates DB record to `published`.
    - Dispatches cache invalidation for `/api/mandals`.

---

## 3. Input Validation Schemas (Zod)

```typescript
import { z } from "zod";

export const ReviewSubmissionSchema = z.object({
    submissionType: z.literal("review"),
    mandalId: z.string().uuid(),
    authorName: z.string().min(2).max(50).default("Devotee"),
    rating: z.number().int().min(1).max(5),
    crowdObservation: z.enum(["low", "moderate", "heavy", "very_heavy"]).optional(),
    comment: z.string().min(5).max(1000),
    turnstileToken: z.string().min(10)
});

export const MandalSuggestionSchema = z.object({
    submissionType: z.literal("new_mandal"),
    nameEn: z.string().min(3).max(100),
    nameMr: z.string().min(3).max(100),
    localityEn: z.string().min(2).max(50),
    localityMr: z.string().min(2).max(50),
    latitude: z.number().min(18.89).max(19.01),
    longitude: z.number().min(72.78).max(72.87),
    foundedYear: z.number().int().min(1800).max(2027).optional(),
    description: z.string().max(1000).optional(),
    turnstileToken: z.string().min(10)
});
```

---

## 4. Error Handling Protocol (RFC 7807)

Every non-2xx response must return standard `application/problem+json`:

```json
{
    "type": "https://bappamap.in/errors/validation-failed",
    "title": "Invalid Request Parameters",
    "status": 400,
    "detail": "Coordinates must fall within the South Mumbai bounding box [18.89, 72.78] to [19.01, 72.87].",
    "instance": "/api/submissions",
    "invalidParams": [
        {
            "name": "latitude",
            "reason": "Expected number <= 19.01, received 19.12"
        }
    ]
}
```

---

## 5. Background Jobs & Scheduled Workers

1. **Crowd Decay Calculation (Every 30 Minutes):**
    - Scheduled via Cloudflare Cron Trigger (`*/30 * * * *`).
    - Runs SQL window aggregation calculating weighted mode of `crowd_level` from `crowd_reports` submitted within the last 120 minutes.
    - Updates `mandals.current_crowd_level`.
2. **Quarantine Retention Cleaner (Daily):**
    - Drops `rejected` photos from R2 quarantine after 7 days.

---

## 6. Document Cross-References

- [02-architecture.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/02-architecture.md) — System flow and caching tiers.
- [03-database-schema.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/03-database-schema.md) — Relational models and constraints.
- [08-trust-and-safety.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/08-trust-and-safety.md) — Spam defenses and moderation flow.
- [09-security-and-privacy.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/09-security-and-privacy.md) — Token validation and rate limiting.
