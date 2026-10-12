# BappaMap Mumbai (बाप्पा मॅप मुंबई)

An edge-first, privacy-respecting interactive map and community directory for the iconic Ganpati mandals of South Mumbai (Colaba to Lalbaug / Parel). Engineered for high responsiveness under congested cellular networks during Mumbai's annual Ganeshotsav festival.

---

## Key Features

- **Interactive Vector Map:** Powered by MapLibre GL JS and OpenFreeMap vector tiles with South Mumbai bounding box lock (`[72.78, 18.89]` to `[72.87, 19.015]`).
- **Unified FastAPI + PostGIS Backend:** Production-grade PostgreSQL database with native PostGIS spatial points, GiST indexes, and bounding box / radius queries (`ST_DWithin`, `ST_MakeEnvelope`).
- **Real-Time Map Streaming (SSE):** Live Server-Sent Events (`/api/events`) streaming approved mandals, real-time crowd tier updates, and review counts to connected clients without manual page refresh.
- **Queue-Aware Live Crowd Intelligence:** Server-side 2-hour linear decay engine calculating separate crowd levels and confidence metrics for **Mukh Darshan** vs **Charan Sparsh** queues.
- **Zero Geolocation Guarantee:** Strict privacy posture that never calls `navigator.geolocation` or prompts for user coordinates. "Nearby" queries use a user-chosen map point only.
- **Bilingual Interface:** Full English and Marathi (Devanagari) localization with persistent user preference and authentic typography using Mukta and Tiro Devanagari Marathi.
- **Community Contribution Pipeline:** Turnstile and honeypot-protected submissions for suggesting mandals, darshan reviews, and photo uploads with client-side EXIF/GPS stripping and canvas WebP normalization.
- **Pre-Moderation Quarantine & Audit Trail:** Multi-instance quarantine with an immutable moderation audit log and Argon2 timing-safe admin session authentication.
- **DPDP Act 2023 Compliance:** Client IP addresses are never logged or stored in plain text; salted one-way HMAC-SHA256 hashes are used for persistent rate limiting.

---

## Tech Stack

| Layer                       | Technology                                                                     |
| --------------------------- | ------------------------------------------------------------------------------ |
| **Frontend Framework**      | Next.js 15 (App Router, Static First)                                          |
| **Backend Framework**       | FastAPI, Pydantic v2, SQLAlchemy 2.0 (asyncio + asyncpg)                       |
| **Database & Geospatial**   | PostgreSQL 15+ with PostGIS 3.3+, Alembic migrations                           |
| **Real-Time Engine**        | Server-Sent Events (SSE) via `sse-starlette`                                   |
| **Map Engine**              | MapLibre GL JS, OpenFreeMap vector tiles                                       |
| **Bot Defense & Privacy**   | Cloudflare Turnstile, DPDP Salted IP Hashing, HTML5 Canvas EXIF stripping       |
| **Testing & Quality**       | Vitest (Frontend), Pytest (Backend + PostGIS), Playwright (E2E), Axe-core (A11y)|

---

## Local Development (Windows PowerShell)

### Prerequisites

1. **Node.js 18+ or 20+**
2. **Python 3.12+**
3. **PostgreSQL 15+ with PostGIS 3.3+** (Running locally on port 5432 or via Docker Compose)

### 1. Database Setup

Using Docker Compose:
```powershell
docker compose up -d
```

Or using native Windows PostgreSQL service:
```powershell
# Ensure postgres service is running and PostGIS extension is enabled
psql -U postgres -c "CREATE DATABASE bappamap;"
psql -U postgres -d bappamap -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Backend Setup & Seeding

```powershell
# Navigate to backend and create virtual environment
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .

# Run Alembic migrations to head
alembic upgrade head

# Seed initial 12 iconic South Mumbai mandals idempotently
python scripts/seed.py

# Run FastAPI backend server (port 8000)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup

In a separate PowerShell terminal:
```powershell
# Return to project root
npm install

# Start Next.js development server (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application. Next.js automatically proxies all `/api/*` requests to the FastAPI backend at `http://127.0.0.1:8000`.

---

## Quality Verification & Tests

### Backend Tests (Pytest against real PostgreSQL/PostGIS)
```powershell
.\backend\.venv\Scripts\python.exe -m pytest backend\tests -v
```

### Backend Linter (Ruff)
```powershell
.\backend\.venv\Scripts\python.exe -m ruff check backend
```

### Frontend Unit & Invariant Tests (Vitest)
```powershell
npm run test:unit
```

### Frontend Type Check & Linter
```powershell
npx tsc --noEmit
npm run lint
```

### End-to-End Tests (Playwright)
```powershell
npx playwright test
```

---

## Non-Negotiable Invariants

1. **Zero Geolocation:** Never call `navigator.geolocation` or prompt for location permissions. Verified via automated CI linting and unit tests.
2. **South Mumbai Bounds Lock:** Map viewport and backend coordinate ingestion are strictly locked between `[72.78, 18.89]` and `[72.87, 19.015]`.
3. **Zero Paid Map APIs:** Built with MapLibre GL JS and open vector tiles.
4. **Client-Side EXIF Stripping:** Photos are stripped of EXIF/GPS metadata via HTML5 Canvas before uploading.
5. **Pre-Moderation Quarantine:** All user submissions are quarantined as `pending` until approved by an administrator.
6. **DPDP Compliance:** Client IPs are hashed with a cryptographic salt using HMAC-SHA256; raw IPs are never stored or logged.
7. **Bot Defense:** All public submissions verify Cloudflare Turnstile server-side with honeypot spam protection.
8. **Bilingual Parity:** English and Marathi support maintained across data models, endpoints, and UI.

---

## License

This project is licensed under the MIT License.
