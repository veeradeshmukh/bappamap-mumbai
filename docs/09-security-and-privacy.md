# Security, Threat Model & Privacy Architecture

## Document Details

- **Project:** BappaMap Mumbai
- **Classification:** Public Geospatial UGC Application
- **Threat Modeling Standard:** STRIDE
- **Status:** Approved Specification

---

## 1. STRIDE Threat Model & Mitigations

| Threat Category             | Potential Attack Vector                                                                            | Impact                                                    | Engineering Mitigation                                                                                                                                          |
| :-------------------------- | :------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spoofing (Identity)**     | Bots flooding fake crowd reviews or creating dummy accounts.                                       | Distorts crowd wait times; erodes platform trust.         | Hybrid identity model: Cloudflare Turnstile token verification required on every write; admin actions protected by Supabase JWT session.                        |
| **Tampering (Data)**        | Attackers submitting malicious GPS coordinates outside Mumbai or altering famous mandal locations. | Misguides devotees to incorrect physical sites.           | Hard server-side Zod boundary checks (`lat: 18.89..19.01`, `lng: 72.78..72.87`). Pre-moderation quarantine ensures zero unverified coordinates appear publicly. |
| **Repudiation**             | Malicious users denying abusive submissions or spamming.                                           | Operational difficulty tracking coordinated harassment.   | One-way salted IP hashing (`ip_hash`) and submission timestamp logging in PostgreSQL audit table.                                                               |
| **Information Disclosure**  | Scraping user GPS locations or leaking private image EXIF data.                                    | Privacy violations for devotees taking photos in pandals. | Zero geolocation collection in client code. Browser-side HTML5 canvas strips 100% of EXIF, GPS, and device metadata before upload.                              |
| **Denial of Service (DoS)** | High-frequency traffic spikes crashing the application during festival aarti hours.                | Devotees unable to access maps and directions.            | Static Edge caching (Cloudflare Pages), R2 zero-egress asset serving, and WAF rate limiting (5 req/min on write endpoints).                                     |
| **Elevation of Privilege**  | Normal visitor attempting to approve quarantined reviews.                                          | Unauthorized publishing of unvetted photos.               | PostgreSQL Row-Level Security (RLS) restricts write operations on `published` status to service-role tokens; API verifies Supabase admin JWT.                   |

---

## 2. Zero-Location Guarantee & Permissions Policy

BappaMap strictly guarantees that user location is never requested, accessed, or retained.

### 2.1 Technical Enforcement

1. **HTTP Permissions-Policy Header:**
    ```http
    Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
    ```
    This browser-level directive disables the Geolocation API completely, causing any rogue attempt to call `navigator.geolocation` to throw an immediate exception.
2. **ESLint Restriction Rule:**
   CI fails if any source file contains `navigator.geolocation` or `getCurrentPosition`.
3. **Playwright E2E Audit:** Automated test verifies that zero permission prompts are triggered during full user flows.

---

## 3. Edge Security Headers & CSP

Implemented in `next.config.mjs` and Cloudflare edge rules:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.bappamap.in https://*.cloudflare.com; connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://*.openfreemap.org https://*.bappamap.in; font-src 'self' data:; worker-src 'self' blob:; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 4. Secret Hygiene & Credentials Management

- **Zero Hardcoded Secrets:** All credentials, database connection strings, and API secrets are stored strictly in environment variables (`.env.local` for development, encrypted secrets in Cloudflare Dashboard and GitHub Actions).
- **Environment Variable Manifest:**
    - `NEXT_PUBLIC_APP_URL`: Public canonical URL (`https://bappamap.in`)
    - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Public Cloudflare Turnstile key
    - `TURNSTILE_SECRET_KEY`: Server-side secret for Turnstile validation
    - `SUPABASE_URL`: Public Supabase API gateway URL
    - `SUPABASE_ANON_KEY`: Public anon key (read-only queries via RLS)
    - `SUPABASE_SERVICE_ROLE_KEY`: Server-only secret for admin actions
    - `R2_ACCESS_KEY_ID`: Cloudflare R2 S3 API access key
    - `R2_SECRET_ACCESS_KEY`: Cloudflare R2 S3 API secret key
    - `R2_BUCKET_QUARANTINE`: Private quarantine bucket name
    - `R2_BUCKET_PUBLIC`: Public CDN photo bucket name
    - `IP_SALT`: Secret salt for one-way IP hashing

---

## 5. Data Retention & Privacy Lifecycle

| Data Type                   | Retention Period           | Storage Location                            | Purge Mechanism                        |
| :-------------------------- | :------------------------- | :------------------------------------------ | :------------------------------------- |
| **Published Mandal Data**   | Permanent (Annual updates) | PostgreSQL (`mandals`)                      | Versioned seed migrations              |
| **Published Reviews**       | Permanent                  | PostgreSQL (`reviews`)                      | Manual user takedown upon request      |
| **Published Photos**        | 3 years (Archival)         | Cloudflare R2 (`bappamap-public`)           | Lifecycle rule to Glacier/Archive      |
| **Quarantined Submissions** | 30 days                    | PostgreSQL (`submissions`)                  | Automated monthly cleanup cron         |
| **Rejected Photo Blobs**    | 7 days                     | Cloudflare R2 (`bappamap-quarantine`)       | Automated R2 Lifecycle expiration rule |
| **Salted IP Hashes**        | 14 days (Sliding window)   | PostgreSQL (`submissions`, `crowd_reports`) | Database partition truncation          |

---

## 6. Indian Legal & Regulatory Checklist (For Professional Legal Counsel)

_(Note: The following represents an engineering compliance checklist for review with a qualified Indian advocate; it does not constitute formal legal counsel)._

1. **Digital Personal Data Protection Act, 2023 (DPDPA 2023):**
    - Confirm that salted IP hashes and voluntary nicknames fall under permissible statistical usage.
    - Verify that cookieless web analytics (Cloudflare Web Analytics) does not require explicit DPDPA cookie consent banners.
2. **Information Technology Act, 2000 & IT Rules, 2021 (Rule 3):**
    - Review the Grievance Officer appointment statement published on the site.
    - Formalize the 24-hour and 36-hour takedown workflow procedures.
3. **UGC & Intellectual Property Disclaimer:**
    - Review user agreement clause asserting that contributors grant a non-exclusive license for community display and warrant that uploaded images do not infringe third-party copyrights or privacy rights.

---

## 7. Document Cross-References

- [02-architecture.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/02-architecture.md) — Edge network and quarantine storage.
- [04-backend-prd.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/04-backend-prd.md) — Backend validation and error formats.
- [08-trust-and-safety.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/08-trust-and-safety.md) — Moderation engine and takedown workflows.
- [10-testing-and-qa.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/10-testing-and-qa.md) — Automated security and geolocation tests.
