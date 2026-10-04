# BappaMap Mumbai — Project Context & Documentation Index

@[Agentic Coding Standards](~/.gemini/config/rules/agentic_coding_standards.md)

---

## 1. Project Overview

**BappaMap Mumbai** is a high-performance, mobile-first, privacy-respecting interactive map and community directory for the iconic Ganpati mandals of South Mumbai (Colaba to Lalbaug/Parel). Built for extreme resilience under congested cellular festival traffic.

- **Stack:** Next.js (App Router, Static First), TypeScript, Tailwind CSS, MapLibre GL JS.
- **Geospatial & Storage:** OpenFreeMap / PMTiles on Cloudflare R2, Supabase PostgreSQL with PostGIS.
- **Bot Defense & Privacy:** Cloudflare Turnstile, strict zero-geolocation policy, client-side EXIF stripping.
- **Languages:** English and Marathi (Devanagari: Mukta, Tiro Devanagari Marathi).

---

## 2. Documentation Index

Load the master PRD plus the relevant domain specification before beginning any sprint task:

- @[Master PRD](docs/01-PRD.md) — Vision, user personas, MVP scope, hard constraints, and non-goals.
- @[System Architecture](docs/02-architecture.md) — System design, request flows, caching, and spike defense.
- @[Database Schema & Models](docs/03-database-schema.md) — PostGIS geometry, extensible filter model, and migrations.
- @[Backend PRD & APIs](docs/04-backend-prd.md) — Route handlers, Zod validation, error contracts, and Turnstile.
- @[Frontend PRD & UI Specs](docs/05-frontend-prd.md) — Map behaviors, pin parity, filter sync, and performance budgets.
- @[Visual Design System](docs/06-design-system.md) — Palette, bilingual typography, custom map styles, anti-slop checklist.
- @[Content & Seed Data](docs/07-content-and-data.md) — Verified launch mandals, sources, and maintenance rules.
- @[Trust, Safety & Moderation](docs/08-trust-and-safety.md) — Pre-moderation quarantine, spam filters, and takedown SLAs.
- @[Security & Threat Model](docs/09-security-and-privacy.md) — STRIDE model, headers, zero-location guarantee, legal checklist.
- @[Testing & QA Strategy](docs/10-testing-and-qa.md) — TDD protocols, unit tests, Playwright E2E, and accessibility scans.
- @[Deployment & Operations](docs/11-deployment-and-ops.md) — GitHub Actions CI/CD, database backups, and incident runbooks.
- @[Sprint Plan (Sprints 1-4)](docs/12-sprint-plan.md) — Sprint goals, tasks, acceptance criteria, and definition of done.
- @[Product Roadmap](docs/13-roadmap.md) — Post-MVP walking trails, offline PWA, and annual operational rhythm.
- @[Architecture Decision Records](docs/decisions/) — Accepted architectural choices (ADR 0001 to 0006).

---

## 3. Essential Commands

```bash
# Development
npm run dev              # Start local development server at localhost:3000
npm run typecheck        # Verify TypeScript types without emitting artifacts
npm run lint             # Execute ESLint checks across codebase

# Database & Migrations
npm run db:migrate       # Apply SQL migrations to PostgreSQL/PostGIS database
npm run db:seed          # Seed database with verified South Mumbai mandal records

# Quality Assurance & Testing
npm run test:security    # Enforce zero-geolocation and security boundary checks
npm run test:unit        # Execute Vitest unit and integration test suite
npm run test:e2e         # Execute Playwright cross-device and accessibility tests
npm run build            # Compile production-optimized static bundle
```
