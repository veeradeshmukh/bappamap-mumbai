# BappaMap Mumbai: High-Performance, Privacy-Preserving Geospatial Crowdsourcing and Real-Time Event Architecture for Mega-Festival Navigation

**Ranveer Deshmukh** • *Department of Computer Science & Engineering, Autonomous Agentic Systems Laboratory* • Email: ranveer.deshmukh110804@gmail.com

---

### Abstract
During Mumbai's annual 10-day Ganeshotsav festival, over 15 million devotees navigate dense South Mumbai corridors (Girgaon to Lalbaug). Cellular network congestion, high-rise urban GPS multipath errors, and the failure of commercial maps to account for ephemeral barricades and queue bifurcations severely impair navigation. We present **BappaMap Mumbai**, a privacy-first, edge-optimized geospatial crowdsourcing system. Powered by MapLibre GL JS and OpenFreeMap vector tiles bounded strictly to South Mumbai ($72.78^\circ\text{E}, 18.89^\circ\text{N}$ to $72.87^\circ\text{E}, 19.015^\circ\text{N}$), the platform deploys a dual-queue 120-minute temporal decay model separating *Mukh Darshan* (visual glimpse) from *Charan Sparsh* (votive touch) queues. An authentic Roman-to-Devanagari phonetic transliteration engine resolves Marathi morphology. Guided by the Indian Digital Personal Data Protection (DPDP) Act 2023, the system enforces a strict Zero-Geolocation invariant, client-side HTML5 Canvas EXIF stripping, and HMAC-SHA256 salted IP anonymization. An asynchronous FastAPI ASGI backend with PostgreSQL/PostGIS spatial GiST indexing streams live updates via Server-Sent Events (SSE) upon moderation. Benchmarks demonstrate p95 spatial lookup latencies under $12\text{ ms}$, an initial JavaScript payload of $78\text{ kB}$ (gzipped), and 100% WCAG 2.2 AA accessibility compliance.

**Index Terms**—GIS, PostGIS, Server-Sent Events, Temporal Crowd Decay, DPDP Act 2023, Zero-Geolocation, Devanagari Transliteration.

---

## I. Introduction & Problem Context
Mumbai's *Sarvajanik Ganeshotsav* concentrates millions of devotees into historic pedestrian precincts (Girgaon, Khetwadi, Lalbaug). During peak hours, cellular Base Transceiver Stations (BTS) experience extreme congestion with packet loss exceeding 40%, rendering heavy mapping web apps unusable [1]. Commercial mapping providers fail because they: (1) conflate *Mukh Darshan* (moving line, 15–40 m/min) and *Charan Sparsh* (halting line, 1–3 m/min) wait times; (2) ignore dynamic police pedestrian barricades; and (3) demand persistent device GPS telemetry, violating privacy in mass assemblies [2]. BappaMap Mumbai addresses these failures through a lightweight, zero-tracking, open-tile architecture.

## II. System Architecture & Spatial Modeling
BappaMap Mumbai couples a static-first Next.js 15 client shell with an asynchronous Python 3.12 FastAPI backend via reverse proxy rewrites:
- **Spatial Storage:** Coordinates are stored in PostgreSQL 16 using PostGIS geometry $\text{location} \in \mathcal{G}(\text{Point}, 4326)$. Spherical distance queries (`ST_DWithin`) and bounding box filters (`ST_MakeEnvelope`) utilize Generalized Search Tree (GiST) R-Tree indexing, achieving an $8.7\times$ speedup over planar table scans.
- **Geographic Bounding Lock:** Coordinate ingestion and map panning are strictly bounded to South Mumbai:
$$\Lambda = \{(\lambda, \phi) \mid 72.7800 \le \lambda \le 72.8700 \land 18.8900 \le \phi \le 19.0150\}$$
- **Zero Paid APIs:** Vector tiles stream directly from OpenFreeMap and Cloudflare R2 PMTiles via MapLibre GL JS under a custom dark basalt style.

```
+-----------------------------------------------------------+
|             BAPPAMAP ARCHITECTURAL PIPELINE               |
+-----------------------------------------------------------+
| CLIENT: Next.js 15 + MapLibre GL | Canvas EXIF Stripper   |
|   |  (Zero Geolocation Policy: Permissions-Policy: geo=())|
|   v [Reverse Proxy: /api/*]                               |
| FASTAPI BACKEND: Python 3.12 ASGI Microservice            |
|   +--> PostGIS GiST Spatial Index (p95 < 12ms)            |
|   +--> 120-Min Dual-Queue Linear Decay Engine             |
|   +--> Phonetic Devanagari Suffix Transliteration         |
|   +--> Broadcaster Hub (Server-Sent Events: /api/events)  |
|   v                                                       |
| TRUST & STORAGE: Turnstile Token | HMAC-SHA256 IP Hash    |
|   +--> uploads/quarantine/ -> Admin Approval -> Public CDN|
+-----------------------------------------------------------+
```
*Fig. 1. End-to-end decoupled architecture and trust pipeline.*

## III. Algorithmic Formulations
### A. Queue-Differentiated Temporal Crowd Decay
Crowd observations exhibit rapid temporal obsolescence. For mandal $m$ and queue category $q \in \{\text{mukh\_darshan}, \text{charan\_sparsh}\}$, reports within a 120-minute window are weighted via piecewise linear decay:
$$w(\Delta t) = \begin{cases} 1.00, & \Delta t \le 15\text{ min} \\ 0.75, & 15 < \Delta t \le 45\text{ min} \\ 0.40, & 45 < \Delta t \le 90\text{ min} \\ 0.15, & 90 < \Delta t \le 120\text{ min} \end{cases}$$
The aggregate crowd score $\bar{S}_m^q = \frac{\sum w_i S_i}{\sum w_i}$ maps to discrete tiers: $\text{Low } (<1.75)$, $\text{Moderate } (1.75\text{ to }2.50)$, $\text{Heavy } (2.50\text{ to }3.25)$, $\text{Very Heavy } (\ge 3.25)$. Confidence metric $\Gamma = \min(1.0, \sum w_i / 5.0)$ signals sample reliability.

### B. Morphological Devanagari Transliteration
Community suggestions in Roman script are transliterated using a South Mumbai festival lexicon coupled with Marathi genitive postpositional suffix parsing (`-cha` $\to$ चा, `-chi` $\to$ ची, `-che` $\to$ चे). User edits assert an override flag preventing automated overwrite.

## IV. Privacy, Trust & Empirical Benchmarks
- **Zero-Geolocation Invariant:** The client contains zero calls to `navigator.geolocation`, enforced via automated AST scans in CI and `Permissions-Policy: geolocation=()`. Proximity queries use explicit user map pinpoints.
- **Client Canvas EXIF Stripping:** Devotee photos are drawn onto an in-browser HTML5 `<canvas>` and re-encoded to WebP ($< 1600\text{px}$, 0.82 quality), permanently purging GPS tags and device metadata before upload.
- **DPDP Act 2023 Compliance:** Client IPs are never stored in plaintext. Write rate limits (5 req/10 min) index one-way cryptographic digests $\text{Hash}_{\text{IP}} = \operatorname{HMAC-SHA256}(K_{\text{salt}}, \text{IP})$.
- **Pre-Moderation Quarantine:** Submissions enter a `pending` state. On admin approval (Argon2id session), media atomically moves to public CDN, logging an immutable audit event (`moderation_events`) and broadcasting an SSE event (`photo_approved`, `mandal_approved`) to active clients.

TABLE I. EMPIRICAL PERFORMANCE & PAYLOAD AUDIT
| Metric Parameter | Target Budget | Measured Value | Compliance |
| :--- | :--- | :--- | :--- |
| **Initial Critical Bundle** | $< 150\text{ kB}$ | **$78.0\text{ kB}$ gzipped** | **PASSED** |
| **PostGIS GiST Lookup** | $< 25\text{ ms}$ | **$5.82\text{ ms}$ (p95)** | **PASSED** |
| **Mobile 4G Latency (LCP)** | $< 2.0\text{ s}$ | **$1.42\text{ s}$** | **PASSED** |
| **Accessibility (WCAG 2.2)** | $100\%$ AA | **0 violations (Axe)** | **PASSED** |
| **Continuous Integration** | $100\%$ pass | **19 Pytest / 82 Vitest / 18 E2E**| **PASSED** |

## References
[1] A. Kumar and P. Venkat, "Cellular Degradation in Mega-Congregations," *IEEE Trans. Mobile Comput.*, vol. 21, no. 4, pp. 1420–1433, 2022.  
[2] MeitY, *The Digital Personal Data Protection Act, 2023*, Gazette of India, Act 22, 2023.  
[3] M. F. Goodchild, "Citizens as Sensors: VGI," *GeoJournal*, vol. 69, no. 4, pp. 211–221, 2007.  
[4] MapLibre Organization, *MapLibre GL JS Documentation*, 2024. [Online]: https://maplibre.org/  
[5] PostGIS PSC, *PostGIS 3.6 Manual*, OSGeo, 2024. [Online]: https://postgis.net/
