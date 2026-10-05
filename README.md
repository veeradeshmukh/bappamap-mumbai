# BappaMap Mumbai (बाप्पा मॅप मुंबई)

An edge-first, privacy-respecting interactive map and community directory for the iconic Ganpati mandals of South Mumbai (Colaba to Lalbaug / Parel). Engineered for high responsiveness under congested cellular networks during Mumbai's annual Ganeshotsav festival.

---

## Key Features

- **Interactive Vector Map:** Powered by MapLibre GL JS and OpenFreeMap vector tiles with South Mumbai bounding box lock (`[72.78, 18.89]` to `[72.87, 19.01]`).
- **Zero Geolocation Guarantee:** Strict privacy posture that never calls `navigator.geolocation` or tracks user coordinates. All routing is delegated to external map applications via universal Google Maps deep links.
- **Bilingual Interface:** Full English and Marathi (Devanagari) localization with persistent user preference and authentic typography using Mukta and Tiro Devanagari Marathi.
- **Dynamic Theming:** Seamless Dark Basalt and Coastal Light modes with custom MapLibre vector tile style specifications and system preference auto-detection.
- **Filterable Mandal Directory:** Real-time bidirectional synchronization between directory cards and map markers with URL-persisted search parameters (`/?crowd=low&parking=true&lang=mr`).
- **Marker Hover & Touch Parity:** Instant marker preview with a 300ms transit grace period to access external navigation links, alongside tap and keyboard focus (`Tab` + `Enter`) parity.
- **Community Contribution Pipeline:** Turnstile-protected submissions for suggesting mandals, darshan reviews, and photo uploads with client-side EXIF/GPS stripping and canvas WebP normalization.
- **Quarantine & Moderation Portal:** Pre-moderation workflow quarantining submissions until approved via a password-protected admin dashboard.

---

## Tech Stack

| Layer                       | Technology                                                            |
| --------------------------- | --------------------------------------------------------------------- |
| **Frontend Framework**      | Next.js (App Router, Static First)                                    |
| **Language & Styling**      | TypeScript, Tailwind CSS                                              |
| **Map Engine**              | MapLibre GL JS, OpenFreeMap vector tiles                              |
| **Bot Protection**          | Cloudflare Turnstile                                                  |
| **Client Media Processing** | HTML5 Canvas (Metadata stripping & WebP encoding)                     |
| **Testing & Quality**       | Vitest (Unit), Playwright (Cross-browser E2E), Axe-core (WCAG 2.2 AA) |

---

## Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm or pnpm

### Installation

```bash
git clone https://github.com/veeradeshmukh/bappamap-mumbai.git
cd bappamap-mumbai
npm install
```

### Environment Configuration

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Configure your environment variables:

```env
# Admin authentication
ADMIN_PASSWORD=your_secure_admin_password
SESSION_SECRET=your_32_char_random_secret

# Cloudflare Turnstile (Testing key provided in .env.example)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Quality & Testing

### Unit & Integration Tests

```bash
npm run test:unit
```

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

### Accessibility & Type Checks

```bash
npm run typecheck
npm run lint
npm run format:check
```

---

## Project Structure

```
├── data/                  # Verified South Mumbai seed mandal datasets
├── docs/                  # Architecture specs, PRDs, and ADR records
├── migrations/            # SQL migration scripts for PostGIS schema
├── src/
│   ├── app/               # Next.js App Router pages and API routes
│   │   ├── admin/         # Moderator login and queue dashboard
│   │   ├── api/           # Submissions and moderation API endpoints
│   ├── components/
│   │   ├── common/        # Shared buttons, theme toggles, badges
│   │   ├── directory/     # Mandal cards and explorer views
│   │   ├── filters/       # Crowd and accessibility filter bars
│   │   ├── icons/         # Bespoke SVG artwork
│   │   ├── map/           # MapLibre container and marker logic
│   │   ├── modals/        # Contribution forms and Turnstile widget
│   │   └── ui/            # Festive animations and ambient elements
│   ├── hooks/             # Custom React hooks (theme, filters)
│   ├── lib/               # Geospatial math, i18n, decay engine, media
│   └── types/             # TypeScript domain schemas and interfaces
└── tests/
    ├── e2e/               # Playwright cross-browser test suites
    └── unit/              # Vitest domain and utility tests
```

---

## License

This project is licensed under the MIT License.
