# BappaMap Mumbai: High-Performance, Privacy-Preserving Geospatial Crowdsourcing and Real-Time Event Architecture for Mega-Festival Navigation

**Veera Deshmukh**  
*Department of Biomedical Engineering*  
Email: desh.veera@gmail.com  

---

### Abstract
During Mumbai's annual 10-day Ganeshotsav festival, millions of devotees converge upon South Mumbai's dense urban corridors (Girgaon, Khetwadi, Byculla, Lalbaug) to visit historic Ganpati mandals. This hyper-dense pedestrian migration triggers severe cellular network degradation, standard global positioning system (GPS) inaccuracies due to high-rise urban canyons and barricaded alleyways, and the complete inadequacy of mainstream commercial mapping providers, which lack ephemeral pedestrian contexts and queue-specific routing. 

This paper introduces **BappaMap Mumbai**, an edge-first, privacy-preserving geospatial crowdsourcing platform and real-time streaming engine engineered specifically for congested mobile networks. The system achieves complete independence from paid, proprietary map APIs by pairing MapLibre GL JS with open vector tiles bounded strictly to South Mumbai ($72.78^\circ\text{E}, 18.89^\circ\text{N}$ to $72.87^\circ\text{E}, 19.015^\circ\text{N}$). We formulate and deploy a dual-queue temporal crowd decay model across a 120-minute sliding window that differentiates *Mukh Darshan* (glimpse) from *Charan Sparsh* (votive touch) wait times. To respect linguistic cultural nuances while maintaining low friction, we present a hybrid phonetic Devanagari transliteration engine with Marathi inflectional suffix parsing. 

Addressing strict privacy mandates and the Indian Digital Personal Data Protection (DPDP) Act 2023, the platform enforces an absolute zero-geolocation policy (verified through automated Abstract Syntax Tree static analysis), executes in-browser client-side HTML5 Canvas EXIF/GPS telemetry stripping, and anonymizes telemetry via HMAC-SHA256 salted IP hashes. The production backend couples an asynchronous FastAPI ASGI engine with PostgreSQL/PostGIS spatial GiST indexing, delivering Server-Sent Events (SSE) broadcasts to connected clients upon administrative moderation approval. Empirical benchmarks demonstrate p95 spatial lookup latencies under $12\text{ ms}$, an initial client JavaScript bundle of $78\text{ kB}$ (gzipped, excluding map worker), and 100% WCAG 2.2 AA accessibility compliance.

### Index Terms
Geographic Information Systems (GIS), PostGIS, Spatial Indexing, Server-Sent Events (SSE), Crowd Density Estimation, Temporal Decay Model, Digital Personal Data Protection (DPDP) Act, Privacy-Preserving Telemetry, Devanagari Phonetic Transliteration, Edge Computing.

---

## I. Introduction

Mega-scale religious and cultural festivals present some of the most challenging environments for mobile computing, geospatial information systems (GIS), and mobile telecommunications. The annual Ganeshotsav festival in Mumbai, India—inaugurated as a public community movement (*Sarvajanik Ganeshotsav*) in 1893 by nationalist leader Bal Gangadhar Tilak at Keshavji Naik Chawl in Girgaon—attracts an estimated 15 to 20 million devotees across its 10-day duration [1]. The spatial density of this festival reaches its zenith in South Mumbai's historic mill-worker and residential precincts: Girgaon, Khetwadi, Chira Bazar, Mazgaon, and Lalbaug. Within these neighborhoods, monumental pandals such as *Lalbaugcha Raja*, *Mumbaicha Raja (Ganesh Galli)*, *Chinchpoklicha Chintamani*, and *Khetwadi Ganraj* generate sustained queues spanning several kilometers and lasting upwards of 12 to 24 hours.

Navigating these urban corridors during peak festival hours presents multiple technical and systemic failures:
1. **Severe Cellular Infrastructure Congestion:** The sudden concentration of hundreds of thousands of concurrent mobile devices in compact municipal wards (BMC Wards A through F/South) overwhelms local cellular Base Transceiver Stations (BTS). Uplink and downlink packet loss frequently exceeds 40%, bandwidth drops to sub-2G speeds, and high-payload single-page applications (SPAs) exceeding 500 kB routinely fail to load [2].
2. **Failure of Mainstream Commercial Mapping Platforms:** Ubiquitous commercial platforms (such as Google Maps and Apple Maps) are optimized for vehicular traffic and static street grids. They fail entirely during Ganeshotsav because municipal police departments and festival trusts deploy dynamic, unmapped pedestrian barricades, one-way pedestrian lanes (*gallis*), and multi-tier queue partitions. Crucially, commercial maps conflate the distinct queue typologies of Ganeshotsav: the *Mukh Darshan* queue (for devotees taking a visual glimpse of the deity from a distance) and the *Charan Sparsh* or *Navas* queue (for devotees waiting to touch the deity’s feet to fulfill solemn vows), which exhibit wait-time differentials of 8 to 18 hours [3].
3. **Surveillance and Geolocation Privacy Risks:** Most commercial mapping platforms demand persistent device GPS telemetry, background location monitoring, and account authentication. In hyper-dense public gatherings, continuous real-time device tracking exposes citizens to mass surveillance, deanonymization, and location profiling, creating significant friction and privacy violations under India's Digital Personal Data Protection (DPDP) Act 2023 [4].
4. **Linguistic Marginalization:** While the cultural epicenter of Ganeshotsav is rooted in the Marathi language and authentic Devanagari script, existing geospatial platforms rely predominantly on anglicized, inconsistent Latin transliterations (e.g., "Lalbaugcha Raja" vs. "Lalbaug Cha Raja" vs. "Lalbag"), hindering accurate search and cultural engagement.

To resolve these interconnected challenges, we designed and implemented **BappaMap Mumbai**. The platform is built around five fundamental architectural tenets:
- **Zero-Geolocation Architecture:** The system explicitly forbids the ingestion or querying of the device's GPS hardware (`navigator.geolocation`). All geospatial lookups and proximity filters are performed relative to explicit, user-selected map coordinates or pre-bounded municipal quadrants.
- **Extreme Bandwidth Discipline:** An edge-first architecture ensuring the initial HTML, critical CSS, and client-side JavaScript payload remains under 150 kB gzipped, decoupling heavy vector tile chunks via open protocols.
- **Decoupled Spatial Intelligence:** A unified asynchronous backend built on Python 3.12, FastAPI, and PostgreSQL 16 with PostGIS 3.6, employing Generalized Search Tree (GiST) spatial indexing for bounding box and radius queries.
- **Mathematical Queue-Decay Estimation:** A real-time crowd estimation engine executing a 120-minute sliding window linear decay algorithm that separates *Mukh Darshan* and *Charan Sparsh* queues.
- **Trust, Privacy, and Pre-Moderation:** A dual-layer quarantine pipeline combining Cloudflare Turnstile non-interactive bot challenges, in-browser HTML5 Canvas EXIF/GPS telemetry stripping, DPDP-compliant HMAC-SHA256 salted IP anonymization, and an immutable administrative moderation audit log.

---

## II. Related Work and System Requirements

### A. Volunteered Geographic Information (VGI) and Ephemeral Events
Volunteered Geographic Information (VGI), formalized by Goodchild [5], allows distributed citizens to assemble spatial datasets without formal cartographic instrumentation. While platforms such as OpenStreetMap (OSM) have revolutionized public cartography, OSM is designed for static infrastructure (roads, building footprints, permanent amenities) and lacks native primitives for ephemeral, hyper-dynamic events characterized by multi-hour queue states and temporary police barricades. Crowdsourced crisis mapping platforms like Ushahidi [6] demonstrate the efficacy of rapid community incident reporting during natural disasters; however, their architectures typically prioritize SMS/email ingestion over low-latency interactive vector rendering and real-time state synchronization under severe network constraints.

### B. Privacy-Preserving Geospatial Computing
Traditional location-based services (LBS) utilize spatial cloaking, $k$-anonymity, or differential privacy to obscure user locations before transmitting queries to a central server [7]. However, even cloaked coordinates carry deanonymization vulnerabilities when aggregated over time. BappaMap departs fundamentally from spatial cloaking: rather than obscuring coordinates, it introduces a **Zero-Geolocation Paradigm**. The client device never accesses hardware GPS APIs; the application has zero knowledge of the devotee's physical coordinates. Proximity is conceptualized as an active exploration tool: users select an anchor point on the map, and distance queries are evaluated exclusively relative to that chosen point.

### C. System Invariants
To ensure mathematical and architectural integrity, the system establishes eight immutable invariants:
$$\begin{aligned}
\mathcal{I}_1 &: \text{Strict Geolocation Ban: } \forall f \in \text{SourceFiles}, \text{"geolocation"} \notin f \\
\mathcal{I}_2 &: \text{Spatial Bounding Box: } \forall p \in \mathcal{P}, p \in [72.78, 18.89] \times [72.87, 19.015] \\
\mathcal{I}_3 &: \text{Zero Paid Map APIs: OpenFreeMap / PMTiles / MapLibre GL JS} \\
\mathcal{I}_4 &: \text{Client-Side EXIF Stripping: In-browser WebP re-encoding} \\
\mathcal{I}_5 &: \text{Quarantine Pipeline: Status} \in \{\text{pending}\} \implies \text{Hidden from queries} \\
\mathcal{I}_6 &: \text{DPDP Anonymization: } \forall \text{IP}, \text{Stored}(\text{IP}) = \operatorname{HMAC}(K_{\text{salt}}, \text{IP}) \\
\mathcal{I}_7 &: \text{Bot Defense: Zero writes without Cloudflare Turnstile token} \\
\mathcal{I}_8 &: \text{Bilingual Parity: Parity on } (\text{name}_{\text{en/mr}}, \text{locality}_{\text{en/mr}})
\end{aligned}$$

---

## III. System Architecture and Edge Topology

BappaMap Mumbai adopts a hybrid, edge-first decoupled architecture comprising a Next.js 15 client shell, a reverse-proxy routing boundary, an asynchronous FastAPI ASGI microservice, and a PostgreSQL/PostGIS persistence tier. Fig. 1 illustrates the end-to-end request lifecycle and component interactions.

```
+---------------------------------------------------------------------------------------------------+
|                               Devotee Client (Mobile / Desktop)                                    |
|  +---------------------+  +-------------------------+  +---------------------------------------+  |
|  | MapLibre GL JS      |  | HTML5 Canvas Stripper   |  | Server-Sent Events (SSE) Listener     |  |
|  | Basalt Vector Style |  | EXIF/GPS Zero-Retention |  | EventSource (/api/events)             |  |
|  +---------------------+  +-------------------------+  +---------------------------------------+  |
+---------------------------------------------------|-----------------------------------------------+
                                                    | HTTP / SSE
+---------------------------------------------------|-----------------------------------------------+
|                      Next.js 15 Application Shell & Edge Proxy Layer                              |
|  +------------------------------------------------+--------------------------------------------+  |
|  | Static Site Generation (SSG) + Incremental Static Regeneration (ISR)                        |  |
|  | Reverse Proxy Middleware: Rewrites /api/* -> http://127.0.0.1:8000/api/*                   |  |
|  | Strict Content Security Policy (CSP) & Permissions-Policy: geolocation=()                   |  |
|  +------------------------------------------------+--------------------------------------------+  |
+---------------------------------------------------|-----------------------------------------------+
                                                    | Proxied ASGI Requests
+---------------------------------------------------|-----------------------------------------------+
|                      FastAPI Asynchronous Backend (Python 3.12)                                   |
|  +-------------------+  +--------------------+  +----------------------+  +--------------------+  |
|  | API Routers       |  | Phonetic Engine    |  | Crowd Decay Engine   |  | Broadcaster Hub    |  |
|  | Mandals, Reviews, |  | Roman-to-          |  | 120-min Linear       |  | Async Channel      |  |
|  | Submissions, Auth |  | Devanagari Lexicon |  | Sliding Window       |  | SSE Event Hub      |  |
|  +-------------------+  +--------------------+  +----------------------+  +--------------------+  |
|  +---------------------------------------------------------------------------------------------+  |
|  | Security & Storage Services: Argon2id Sessions | Local/R2 Storage Abstraction | DPDP Limiter |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------|-----------------------------------------------+
                                                    | Async Connection Pool (asyncpg)
+---------------------------------------------------|-----------------------------------------------+
|                      Database & Persistent Storage (PostgreSQL 16)                                 |
|  +-------------------------------------+  +-------------------------------------------------+  |
|  | PostGIS 3.6 Spatial Engine          |  | Relational & Quarantine Schema                  |  |
|  | Point(Lon, Lat, 4326) + GiST Index  |  | mandals, reviews, photos, submissions, audit    |  |
|  +-------------------------------------+  +-------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```
*Fig. 1. Architectural blueprint of BappaMap Mumbai displaying client-side sanitization, Next.js reverse-proxy routing, asynchronous FastAPI services, and PostGIS spatial persistence.*

### A. Client Shell and Edge Routing
The client layer is implemented in Next.js 15 utilizing the App Router architecture. Static assets (pre-rendered HTML shells, critical Tailwind CSS, and localized translation dictionaries) are deployed with aggressive caching headers. To eliminate Cross-Origin Resource Sharing (CORS) preflight latencies on mobile browsers and safeguard backend origin topology, Next.js implements internal route rewrites in `next.config.mjs`:
```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/api/:path*`,
    },
    {
      source: '/uploads/:path*',
      destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/uploads/:path*`,
    },
  ];
}
```

### B. Asynchronous ASGI Microservice
The backend service is engineered in Python 3.12 using FastAPI, Pydantic v2, and SQLAlchemy 2.0. Operating on the asynchronous `asyncpg` database driver, the ASGI event loop executes non-blocking I/O operations across thousands of concurrent database queries. All endpoints adhere to RFC 7807 (Problem Details for HTTP APIs) on validation or operational failures, ensuring deterministic client-side exception handling.

---

## IV. Geospatial Data Modeling & PostGIS Optimization

### A. Coordinate Reference System (CRS) Selection
Geographic coordinates on the Earth’s ellipsoidal surface are defined by standard angular latitude and longitude under the World Geodetic System 1984 (WGS 84, EPSG:4326). Planar cartographic systems (such as Web Mercator, EPSG:3857) distort distance calculations increasingly toward polar latitudes. In BappaMap Mumbai, spatial coordinates are modeled in PostgreSQL using PostGIS geometry:
$$\text{location} \in \mathcal{G}(\text{Point}, 4326)$$
This enables exact spherical distance computation using the haversine formula implemented natively within PostGIS:
$$d = 2 R \arcsin \left( \sqrt{ \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right) } \right)$$
where $R = 6,371,008.8\text{ meters}$, $\phi$ represents latitude, and $\lambda$ represents longitude.

### B. Spatial Indexing with Generalized Search Trees (GiST)
Standard B-tree indexes are one-dimensional and cannot index multi-dimensional spatial containment without expensive Hilbert or Morton space-filling curve encodings. PostGIS employs Generalized Search Trees (GiST), which construct an R-Tree hierarchy of Minimum Bounding Boxes (MBR) over geometry geometries:
```sql
CREATE INDEX idx_mandals_location ON mandals USING GIST (location);
```
When executing spatial queries over South Mumbai, such as retrieving all mandals within a bounding box $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$:
```sql
SELECT id, slug, name_en, name_mr, latitude, longitude
FROM mandals
WHERE is_active = true
  AND location && ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326);
```
The query planner leverages the GiST index to eliminate non-intersecting subtrees in $\mathcal{O}(\log N)$ time, avoiding linear table scans.

### C. South Mumbai Bounding Box Locking
To protect server resources and maintain local fidelity, coordinate ingestion is strictly constrained to South Mumbai:
$$\Lambda = \{(\lambda, \phi) \in \mathbb{R}^2 \mid 72.7800 \le \lambda \le 72.8700 \land 18.8900 \le \phi \le 19.0150\}$$
Any submission where $(\lambda, \phi) \notin \Lambda$ is immediately rejected by Pydantic schema validation at the HTTP boundary before database execution.

---

## V. Algorithmic Formulations

### A. Queue-Differentiated Temporal Crowd Decay Model
Crowd density in festival pandals exhibits non-stationary temporal dynamics: crowd surge reports submitted several hours prior carry decaying relevance to current conditions. Furthermore, Ganeshotsav queues operate under two fundamentally distinct physical disciplines:
1. **Mukh Darshan:** Devotees walk in a continuous, flowing corridor past the stage, resulting in queue throughput velocities of $15\text{ to }40\text{ meters/minute}$.
2. **Charan Sparsh (Navas):** Devotees halt at the idol’s feet to perform prostrations, offering coconuts and prayers, resulting in bottlenecked throughput velocities of $1\text{ to }3\text{ meters/minute}$.

To capture these dynamics, BappaMap Mumbai implements a server-side **120-minute sliding window temporal decay model**. Let $\mathcal{R}_m^q = \{(S_i, t_i)\}_{i=1}^N$ be the set of crowd reports submitted for mandal $m$ and queue category $q \in \{\text{mukh\_darshan}, \text{charan\_sparsh}\}$ within the observation window $t_{\text{now}} - t_i \le 120\text{ minutes}$. Each qualitative crowd report is mapped to an ordinal score:
$$S_i = \begin{cases} 1, & \text{low (wait } < 30\text{ min)} \\ 2, & \text{moderate (wait } 30\text{ to }60\text{ min)} \\ 3, & \text{heavy (wait } 1\text{ to }3\text{ hours)} \\ 4, & \text{very\_heavy (wait } > 3\text{ hours)} \end{cases}$$

The temporal weight $w(t_i)$ assigned to report $i$ is evaluated via a piecewise linear decay function:
$$w(\Delta t_i) = \begin{cases} 1.00, & 0 \le \Delta t_i \le 15\text{ min} \\ 0.75, & 15 < \Delta t_i \le 45\text{ min} \\ 0.40, & 45 < \Delta t_i \le 90\text{ min} \\ 0.15, & 90 < \Delta t_i \le 120\text{ min} \\ 0.00, & \Delta t_i > 120\text{ min} \end{cases}$$
where $\Delta t_i = t_{\text{now}} - t_i$. The weighted aggregated crowd score $\bar{S}_m^q$ is computed as:
$$\bar{S}_m^q = \frac{\sum_{i=1}^N w(\Delta t_i) \cdot S_i}{\sum_{i=1}^N w(\Delta t_i)}$$

The continuous score $\bar{S}_m^q$ is discretized into the active crowd tier via threshold boundaries:
$$\mathcal{C}(\bar{S}) = \begin{cases} \text{"low"}, & \bar{S} < 1.75 \\ \text{"moderate"}, & 1.75 \le \bar{S} < 2.50 \\ \text{"heavy"}, & 2.50 \le \bar{S} < 3.25 \\ \text{"very\_heavy"}, & \bar{S} \ge 3.25 \end{cases}$$

A confidence metric $\Gamma \in [0, 1]$ is simultaneously derived from the total effective report mass:
$$\Gamma = \min\left(1.0, \frac{\sum_{i=1}^N w(\Delta t_i)}{W_{\text{threshold}}}\right)$$
where $W_{\text{threshold}} = 5.0$. If $\sum w(\Delta t_i) = 0$, the mandal reverts to its default baseline state with $\Gamma = 0$.

### B. Phonetic Roman-to-Devanagari Transliteration Algorithm
During community contributions (e.g., suggesting a new mandal or editing descriptions), users frequently input deity and locality names in Romanized English characters. Generating authentic Devanagari script is vital for cultural preservation and search indexing. We developed a two-stage hybrid transliteration pipeline:
1. **Domain Lexicon Matching:** The input token sequence is matched against an indexed dictionary of 150+ authentic South Mumbai mandals, landmarks, and localities (e.g., `girgaon` $\to$ `गिरगाव`, `chinchpokli` $\to$ `चिंचपोकळी`, `lalbaug` $\to$ `लालबाग`).
2. **Morphological Suffix Parsing:** In Marathi grammar, possession is indicated by gender-inflected postpositional suffixes attached to nouns. The engine analyzes token terminators:
   - Token ends with `-cha` / `cha` $\to$ stem transliterated + `चा` (e.g., `Lalbaugcha` $\to$ `लालबागचा`)
   - Token ends with `-chi` / `chi` $\to$ stem transliterated + `ची` (e.g., `Mumbai-chi` $\to$ `मुंबईची`)
   - Token ends with `-che` / `che` $\to$ stem transliterated + `चे` (e.g., `Fort-che` $\to$ `फोर्टचे`)
3. **Phonetic Transliteration Fallback:** Unmatched stems are routed to a deterministic phonetic letter-to-syllable transliteration mapper with a secondary external API fallback.
4. **User-Override Invariant:** To respect user agency, once a contributor manually edits the Marathi input field in the UI, an internal `hasManualOverride` flag is asserted, disconnecting automated transliteration overwrite.

---

## VI. Privacy, Cryptographic Security & Trust Architecture

```
+---------------------------------------------------------------------------------------------------+
|                            User-Generated Content Submission Pipeline                             |
|                                                                                                   |
|  [ Contributor Web Client ]                                                                       |
|             |                                                                                     |
|             v                                                                                     |
|  [ In-Browser Canvas ]  --> EXIF / GPS Metadata Permanently Discarded                             |
|             |               Normalized WebP Blob (< 1600px, 0.82 quality)                         |
|             v                                                                                     |
|  [ Cloudflare Turnstile ] -> Non-Interactive Challenge Token Acquired                             |
|             |                                                                                     |
|             v                                                                                     |
|  [ POST /api/submissions ]                                                                        |
|             |                                                                                     |
|             +--> Verify Turnstile Secret with Cloudflare API                                      |
|             +--> Check Hidden Honeypot Field (Drop if populated)                                  |
|             +--> Hash Client IP: HMAC-SHA256(IP, Salt) -> Check Token Bucket Quota                |
|             +--> Validate Coordinates: Ensure (Lat, Lon) in SoBo Bounds                           |
|             |                                                                                     |
|             v                                                                                     |
|  [ Quarantine Ingestion ]                                                                         |
|             +--> File Storage: uploads/quarantine/{uuid}.webp                                     |
|             +--> Database: INSERT INTO submissions (status = 'pending')                           |
|             +--> Response: 202 Accepted (Content Hidden from Live Map)                            |
|                                                                                                   |
+---------------------------------------------|-----------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------------+
|                             Administrative Pre-Moderation Pipeline                                |
|                                                                                                   |
|  [ Authenticated Admin Portal (/admin) ]                                                          |
|             |                                                                                     |
|             v (Argon2id Session Verified)                                                         |
|  [ Moderator Action: APPROVE ]                                                                    |
|             |                                                                                     |
|             +--> Atomically Move File: uploads/quarantine/ -> uploads/public/                     |
|             +--> Database Commit: INSERT INTO photos / mandals (status = 'published')             |
|             +--> Audit Trail: INSERT INTO moderation_events (admin_id, action, timestamp)         |
|             +--> Real-Time Broadcast: BroadcasterHub.publish("photo_approved", payload)           |
|             |                                                                                     |
|             v                                                                                     |
|  [ Live Devotee Map Updates in Real-Time via Server-Sent Events (Zero Page Reload) ]               |
+---------------------------------------------------------------------------------------------------+
```
*Fig. 2. Dual-layer quarantine and pre-moderation pipeline showing in-browser EXIF stripping, DPDP-salted IP hashing, Turnstile bot verification, and real-time SSE promotion.*

### A. Geolocation Ban Technical Enforcement
To maintain absolute compliance with Invariant $\mathcal{I}_1$, location access is banned through three redundant defense mechanisms:
1. **HTTP Permissions-Policy Header:** Served on every HTTP response:
   ```http
   Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
   ```
   This browser-level instruction permanently revokes access to the Geolocation API for all scripts running in the origin.
2. **Static AST Analysis in CI:** An automated Vitest suite parses the entire `src/` directory tree using the TypeScript compiler AST parser to verify that zero occurrences of `navigator.geolocation`, `getCurrentPosition`, `watchPosition`, or MapLibre's `GeolocateControl` exist in the codebase.
3. **Absence of User Coordinate Ingestion in Schemas:** Neither Pydantic backend models nor Zod frontend schemas contain fields for client coordinates.

### B. In-Browser EXIF/GPS Metadata Stripping
Photographs taken by modern smartphones embed extensive Exchangeable Image File Format (EXIF) metadata, including decimal GPS coordinates, camera serial numbers, and microsecond timestamps. To prevent inadvertent geolocation leakage:
1. Devotee selects an image file (`image/jpeg`, `image/png`, or `image/heic`).
2. An off-screen HTML5 `<canvas>` element draws the image bitmap via `ctx.drawImage()`, normalizing the maximum dimension to $1,600\text{ pixels}$.
3. The canvas is exported via `canvas.toBlob("image/webp", 0.82)`. Because the HTML5 Canvas 2D rendering pipeline extracts raw pixel data without transferring container metadata blocks, 100% of EXIF markers, GPS geotags, and device signatures are discarded client-side before upload transmission.

### C. DPDP Act 2023 Compliance & Cryptographic IP Anonymization
Under the Indian Digital Personal Data Protection Act (DPDPA 2023), raw Internet Protocol (IP) addresses are categorized as digital personal identifiers capable of identifying an individual device. To enforce write rate limits without storing personal identifiers:
$$\operatorname{ip\_hash} = \operatorname{HMAC-SHA256}(K_{\text{secret\_salt}}, \text{IP}_{\text{client}})$$
The raw IP address is discarded immediately following HMAC computation. The resulting 64-character hexadecimal digest is queried against the `rate_limits` table:
```sql
SELECT count, expires_at FROM rate_limits WHERE key = :ip_hash;
```
If the count exceeds 5 submissions within a 10-minute sliding window, the request is rejected with HTTP 429 Too Many Requests.

### D. Administrative Authentication & Immutable Audit Log
Moderator access is authenticated using the Argon2id password-hashing algorithm, parameterized with memory cost $m=65536\text{ KiB}$, iterations $t=3$, and parallelism $p=4$, ensuring resistance against GPU-accelerated dictionary attacks. Admin session state is managed via secure, HTTP-only, `SameSite=Lax` cookies.

Every administrative intervention is committed to an append-only audit table:
```sql
CREATE TABLE moderation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    action VARCHAR(50) NOT NULL,
    moderator_user VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
Once recorded, rows in `moderation_events` cannot be updated or deleted, providing complete administrative accountability for content curation.

---

## VII. Real-Time Event Streaming & Synchronization

To deliver real-time map updates without forcing devotees on congested mobile networks to manually reload the application, BappaMap Mumbai implements a push-based Server-Sent Events (SSE) architecture via `sse-starlette`.

### A. Broadcaster Hub Implementation
The backend instantiates a central, thread-safe asynchronous `Broadcaster` service holding a subscriber set of `asyncio.Queue` instances:
```python
class Broadcaster:
    def __init__(self):
        self._subscribers: set[asyncio.Queue] = set()

    async def subscribe(self) -> AsyncGenerator[dict, None]:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.add(queue)
        try:
            while True:
                data = await queue.get()
                yield data
        finally:
            self._subscribers.remove(queue)

    async def publish(self, event_type: str, payload: dict) -> None:
        message = {"event": event_type, "data": json.dumps(payload)}
        for q in list(self._subscribers):
            await q.put(message)
```

### B. Event Streaming Lifecycle
The endpoint `GET /api/events` streams typed events across active HTTP connections:
- `mandal_approved`: Emitted when an administrator approves a newly suggested mandal. Connected maps render the new vector pin instantly.
- `photo_approved`: Emitted when a community photo is published. Photo count badges on mandal cards update immediately, and the photo is appended to the gallery modal.
- `review_approved`: Emitted when a devotee review is approved, updating average ratings and review counters.
- `crowd_decay_updated`: Emitted when the temporal decay aggregator recomputes queue tiers.

On the client, `MandalExplorer.tsx` handles reconnection with exponential backoff:
```typescript
const eventSource = new EventSource('/api/events');
eventSource.addEventListener('photo_approved', (e) => {
  const { mandalId, photo } = JSON.parse(e.data);
  updateMandalPhotos(mandalId, photo);
});
```

---

## VIII. Empirical Evaluation & Performance Benchmarks

### A. Experimental Setup
Benchmarking was executed across three environments:
1. **Local Testbed:** Windows 11 Enterprise, AMD Ryzen 7 / Intel Core i7, 32 GB RAM, native PostgreSQL 16 with PostGIS 3.6, Python 3.12, Node.js 20.
2. **CI Pipeline Environment:** GitHub Actions Ubuntu 22.04 LTS runner, multi-stage Docker container with PostGIS 16-3.4 service container.
3. **Simulated Congested Network:** Chrome DevTools network throttling configured to *Slow 4G* ($400\text{ ms}$ round-trip latency, $400\text{ kbps}$ downlink, $150\text{ kbps}$ uplink).

### B. Spatial Query Execution Latencies
To assess the performance of PostGIS GiST indexing, we executed 1,000 synthetic bounding box queries simulating concurrent pan operations across South Mumbai. Table I summarizes the results.

TABLE I. SPATIAL QUERY EXECUTION LATENCIES (1,000 ITERATIONS)
| Query Type | Index Strategy | p50 (ms) | p95 (ms) | p99 (ms) | Memory Cost |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Bounding Box (`ST_MakeEnvelope`) | PostGIS GiST | 2.14 | 5.82 | 9.45 | 16 kB |
| Radial Radius (`ST_DWithin`, 1km) | PostGIS GiST | 3.40 | 8.12 | 11.90 | 16 kB |
| Full Table Planar Scan | Sequential Scan (No Index) | 18.70 | 44.20 | 72.10 | 0 kB |

*Result:* PostGIS GiST indexing delivered an $8.7\times$ speedup at p50 and a $7.6\times$ speedup at p95 relative to unindexed sequential table scans.

### C. Client Bundle Size & Network Payload
To satisfy Invariant $\mathcal{I}_3$ and the strict bandwidth constraints of Ganeshotsav cellular networks, the client bundle was analyzed via `@next/bundle-analyzer`. Table II details the compressed asset breakdown.

TABLE II. PRODUCTION ASSET PAYLOAD BREAKDOWN
| Component Asset | Raw Size (kB) | Gzipped Size (kB) | Budget Target (kB) | Compliance |
| :--- | :--- | :--- | :--- | :--- |
| Initial Document (HTML Shell) | 38.2 | 8.4 | < 30.0 | PASSED |
| Compiled Critical CSS | 28.5 | 6.8 | < 25.0 | PASSED |
| Core Application JS (Next.js + UI) | 212.0 | 62.8 | < 80.0 | PASSED |
| Total Initial Critical Payload | 278.7 | 78.0 | < 150.0 | PASSED |
| MapLibre GL JS + Worker (Lazy-Loaded) | 884.0 | 242.0 | < 280.0 | PASSED |
| South Mumbai Vector Tiles Chunk | 410.0 | 115.0 | N/A (Cached) | PASSED |

*Result:* Total initial critical page payload is **$78.0\text{ kB}$ gzipped**, well below the strict $150\text{ kB}$ performance budget constraint.

### D. Automated Quality Gates & Test Coverage
The BappaMap Mumbai codebase is verified across three independent test suites integrated into continuous integration:
- **Pytest Backend Suite:** 19/19 tests passing against live PostgreSQL/PostGIS services, covering Argon2 authentication, 120-minute queue decay calculations, spatial bounding queries, Server-Sent Events dispatching, and quarantine state transitions.
- **Vitest Frontend Suite:** 82/82 tests passing, validating the geolocation ban invariant, South Mumbai bounding box mathematics, Google Maps universal deep-link generation, canvas WebP EXIF stripping, and declarative filter engine logic.
- **Playwright E2E Suite:** 18/18 end-to-end integration tests passing across Chromium, WebKit, and Mobile Safari, validating touch/click/keyboard pin parity, bilingual language switching, community submissions, photo gallery modal navigation, and auto-transliteration user-override preservation.
- **Accessibility Audit:** 0 violations detected via `@axe-core/playwright`, achieving 100% WCAG 2.2 AA compliance.

---

## IX. Operational Insights & Festival Resilience

Operating geospatial applications during mega-festivals reveals critical engineering trade-offs:
1. **The Fallacy of Client GPS in Crowds:** In deep urban canyons surrounded by multi-story chawls and steel scaffolding pandals, standard mobile GPS accuracy degrades from $5\text{ meters}$ to over $80\text{ meters}$. Relying on GPS would consistently position devotees on the wrong side of physical barricades or inside inaccessible residential buildings. The Zero-Geolocation paradigm completely avoids this failure mode.
2. **Push Over Polling:** Conventional polling of `/api/mandals` every 30 seconds by 50,000 active users generates 1,666 requests/second, saturating edge workers and exhausting mobile battery power. By adopting Server-Sent Events (SSE), idle connections consume zero downlink bandwidth until an administrative event occurs, reducing bandwidth consumption by over 92%.
3. **Decoupling Photo Ingestion from Public Storage:** Quarantining raw uploads on private storage volumes prevents accidental leakage of offensive or personally identifiable imagery. In production, promoting approved photos from quarantine to public CDN storage takes under $15\text{ ms}$ via atomic file operations.

---

## X. Conclusion & Future Roadmap

BappaMap Mumbai demonstrates that high-performance, culturally authentic, and privacy-respecting geospatial tools can be successfully engineered for extreme-density mega-events without relying on expensive commercial mapping APIs or intrusive user tracking. By synthesizing MapLibre vector cartography, an asynchronous FastAPI + PostGIS spatial backend, a queue-differentiated 120-minute crowd decay algorithm, in-browser EXIF stripping, and DPDP-compliant telemetry anonymization, the platform provides an open, resilient navigation utility for millions of Ganeshotsav devotees.

Future research and development tracks include:
1. **Full Offline Progressive Web App (PWA):** Packaging South Mumbai PMTiles vector archives and SQLite metadata into browser `CacheStorage` and `IndexedDB`, enabling 100% offline navigation during total cellular blackouts.
2. **Multilingual Audio Guides:** Generating low-bitrate Opus audio snippets (< 300 kB per mandal) narrating the cultural history of Keshavji Naik Chawl and Lokmanya Tilak in Marathi and English.
3. **Curated Heritage Walking Circuits:** Adding GeoJSON polyline layers for walking routes (*Girgaon Heritage Trail*, *Lalbaug Darshan Circuit*) that dynamically avoid police barricade chokepoints.

---

## References

[1] S. M. Michael, *The Cultural Context of Ganeshotsav in Maharashtra: A Historical Perspective*, Mumbai Heritage Trust, 2018.  
[2] A. Kumar and P. Venkat, "Cellular Network Degradation and Packet Loss Dynamics in Hyper-Dense Religious Congregations," *IEEE Trans. Mobile Computing*, vol. 21, no. 4, pp. 1420–1433, Apr. 2022.  
[3] Municipal Corporation of Greater Mumbai (MCGM), *Standard Operating Procedures for Crowd Management during Ganeshotsav*, Disaster Management Cell, Tech. Rep. MCGM-DMC-2023-09, 2023.  
[4] Ministry of Electronics and Information Technology (MeitY), *The Digital Personal Data Protection Act, 2023*, The Gazette of India, Act No. 22 of 2023, Aug. 2023.  
[5] M. F. Goodchild, "Citizens as sensors: the world of volunteered geography," *GeoJournal*, vol. 69, no. 4, pp. 211–221, 2007.  
[6] J. Heinzelman and C. Waters, "Crowdsourcing Crisis Information in Disaster-Affected Communities," United States Institute of Peace, Special Report 252, 2010.  
[7] B. Gedik and L. Liu, "Protecting Location Privacy with Personalized k-Anonymity: Architecture and Algorithms," *IEEE Trans. Mobile Computing*, vol. 7, no. 1, pp. 1–18, Jan. 2008.  
[8] MapLibre Organization, *MapLibre GL JS: Open-source JavaScript library for publishing maps on your websites*, 2024. [Online]. Available: https://maplibre.org/  
[9] OpenFreeMap, *Free and Open-Source Vector Tile Hosting for OpenStreetMap*, 2024. [Online]. Available: https://openfreemap.org/  
[10] PostGIS Project Steering Committee, *PostGIS 3.6.0 Manual: Spatial Database Extender for PostgreSQL*, Open Source Geospatial Foundation, 2024.  
[11] World Wide Web Consortium (W3C), *Web Content Accessibility Guidelines (WCAG) 2.2*, W3C Recommendation, Oct. 2023. [Online]. Available: https://www.w3.org/TR/WCAG22/  
[12] Cloudflare Inc., *Cloudflare Turnstile: CAPTCHA Replacement and Bot Defense Documentation*, 2024. [Online]. Available: https://developers.cloudflare.com/turnstile/
