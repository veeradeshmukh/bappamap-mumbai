# Product Requirements Document (PRD)

## Document Details
- **Project:** BappaMap Mumbai
- **Target Region:** South Mumbai (Colaba to Lalbaug / Parel)
- **Status:** Approved Architecture (Gate 1 Passed)
- **Target Launch:** July 2027 (Pre-Ganeshotsav 2027 window)
- **Primary Audience:** Festival devotees, cultural tourists, local residents, pandal hoppers

---

## 1. Vision & Problem Statement

### 1.1 Context
During Mumbai's 10-day Ganeshotsav festival, millions of visitors navigate South Mumbai's dense, historic neighborhoods (Girgaon, Khetwadi, Byculla, Lalbaug) to take darshan at famous public mandals. Navigating these locations is challenging:
- Cellular connectivity is degraded due to massive crowd density.
- Street names, alleyways (*gallis*), and temporary barricades make standard GPS navigation unreliable.
- Visitors lack real-time crowd insights and verified navigation links.
- Mainstream commercial map applications do not curate festival-specific walking contexts, queue categories (Navas vs Mukh Darshan), or verified pedestrian entry points.

### 1.2 Product Vision
**BappaMap Mumbai** is a high-performance, mobile-first, privacy-respecting interactive map and community directory. It provides curated, verified locations and crowd insights for South Mumbai's major Ganpati mandals, operating smoothly on congested mobile networks without tracking user location or relying on paid proprietary mapping APIs.

---

## 2. User Personas

| Persona | Motivation | Key Pain Points | Core Feature Needed |
| :--- | :--- | :--- | :--- |
| **Pandal Hopper (Local Devotee)** | Visits 5–10 mandals in one night (Girgaon to Lalbaug). | Heavy cellular congestion, battery drain, outdated queue reports. | Fast, cached offline-friendly map, low bundle size, direct Google Maps pedestrian links. |
| **First-Time Cultural Visitor** | Experiencing South Mumbai's historic heritage for the first time. | Language barriers, unverified directions, parking confusion. | Bilingual (English/Marathi) overview, historical context, clear parking/transit notes. |
| **Community Contributor** | Devotee on the ground sharing live queue status or new photos. | Long registration forms, slow upload timeouts. | Frictionless anonymous submission (with bot protection), instant upload feedback. |
| **Site Moderator / Admin** | Mandal volunteer verifying user reports. | Spam, offensive imagery, coordinate tampering. | Single-click moderation portal with pending quarantine state. |

---

## 3. Product Scope

### 3.1 MVP Scope (Sprint 1 to Sprint 4)
1. **Interactive South Mumbai Map:**
   - Map strictly bounded to South Mumbai (`[72.78, 18.89]` to `[72.87, 19.01]`).
   - 10–12 verified seed mandals with coordinates, founding year, and locality.
   - Smooth panning and zooming with hard boundaries (users cannot wander off).
2. **Accessible Pin Interactions:**
   - Unified interaction across touch, click, hover, and keyboard focus (`Tab` + `Enter`).
   - Popup displays mandal name (English + Marathi) and a universal deep link button opening Google Maps.
3. **Filterable Mandal Directory:**
   - Card list below the map displaying crowd level, rating, founding year, and parking.
   - Bidirectional sync: Filtering cards filters map pins; selecting a card centers the map on that pin.
   - URL-persisted filter state for instant link sharing.
4. **Community Contribution Flow ("Add/Review Mandal"):**
   - Three distinct modals:
     1. Suggest a new mandal (name, locality, coordinates, description).
     2. Submit a review and crowd report.
     3. Upload a photo of the mandal.
   - Protected by Cloudflare Turnstile (zero user login friction).
5. **Pre-Moderation Pipeline:**
   - All community submissions quarantined in a `pending` state until reviewed.
   - Password-protected admin dashboard for single-click approvals.
6. **Bilingual Support (English & Marathi):**
   - Toggle in header with persistent user preference.
   - Authentic Devanagari typography using Mukta and Tiro Devanagari Marathi.

### 3.2 Post-MVP / Roadmap Scope
- Live crowd status meter with decay algorithm (user reports weighted over a 2-hour sliding window).
- Audio guide snippets (history of Keshavji Naik Chawl, Lokmanya Tilak heritage).
- Curated walking trails ("Girgaon Heritage Walk", "Lalbaug Darshan Circuit").
- PWA offline caching with Service Workers for complete offline map access.

---

## 4. Hard Constraints & Non-Goals

### 4.1 Strict Constraints
1. **Zero Location Access:** The application shall **never** call `navigator.geolocation`, render a "My Location" button, or prompt for location permissions. Verified via automated CI tests.
2. **Zero Paid Map APIs:** Built using open-source MapLibre GL JS and open vector tiles. No Google Maps JavaScript API keys.
3. **Official Google Maps Deep Link Format:** Navigation buttons must exclusively use:
   `https://www.google.com/maps/search/?api=1&query={latitude}%2C{longitude}`
4. **Bandwidth Budget:** Total initial page payload (HTML + CSS + JS) must not exceed **150 kB gzipped** (excluding initial vector tile chunks).
5. **Touch & Keyboard Parity:** All pin interactions available on desktop mouse hover must be equally accessible on touch tap and keyboard navigation.

### 4.2 Non-Goals
- Turn-by-turn live GPS navigation inside the app (delegated entirely to external map apps via universal deep links).
- User-to-user private messaging or social network profiles.
- Paid VIP darshan passes or commercial e-commerce booking.
- Mandals outside South Mumbai (suburbs like Andheri, Borivali, or Thane are strictly out of scope for this release).

---

## 5. Success Metrics

| Metric | Target | Measurement Method |
| :--- | :--- | :--- |
| **Initial Load Time (LCP)** | < 2.0s on 4G simulated throttle | Lighthouse CI / Web Vitals |
| **Client Bundle Size** | < 120 kB JS gzipped (excluding map worker) | Bundle analyzer in CI |
| **Accessibility Score** | 100% WCAG 2.2 AA compliant | Playwright Axe accessibility scan |
| **Submission Throughput** | < 3s from submission to DB confirmation | Sentry transaction trace |
| **Spam Leakage** | 0 unapproved/offensive submissions in live DB | Automated pre-moderation quarantine |

---

## 6. Document Cross-References
- [02-architecture.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/02-architecture.md) — Technical system design and edge caching strategy.
- [03-database-schema.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/03-database-schema.md) — Database schema, PostGIS geometry, and migrations.
- [05-frontend-prd.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/05-frontend-prd.md) — Map behaviors, component contracts, and accessibility specs.
- [08-trust-and-safety.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/08-trust-and-safety.md) — Moderation rules, quarantine flow, and spam prevention.
