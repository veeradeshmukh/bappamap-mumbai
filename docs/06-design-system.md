# Visual Identity & Design System

## Document Details

- **Project:** BappaMap Mumbai
- **Design Philosophy:** Cultural authenticity, editorial typography, atmospheric warmth, zero generic AI slop
- **Status:** Approved Specification

---

## 1. Visual Direction & Cultural Rooting

BappaMap's aesthetic draws from the living texture of South Mumbai during Ganeshotsav:

- **Basalt Stone & Heritage Architecture:** The deep charcoal and warm granite tones of South Mumbai's Victorian Gothic landmarks (CSMT, Fort precinct) and traditional chawl courtyards (Keshavji Naik Chawl).
- **Ceremonial Vermillion (_Sindoor / Shendur_):** The vibrant red-orange applied in sacred rituals and tilak ceremonies.
- **Marigold Warmth (_Zendu_):** Golden amber tones reminiscent of fresh flower garlands lining the streets from Lalbaug market to Girgaon Chowpatty.
- **Night Festivity:** A sophisticated dark mode inspired by midnight pandal hopping under festoon lighting, balanced with deep oceanic navy reflections from the Arabian Sea coastline.

---

## 2. Color Palette & Tokens

```css
:root {
    /* Canvas & Basalt Neutrals */
    --color-bg-base: #0b0f17; /* Deep Arabian Sea slate (Main Background) */
    --color-bg-surface: #141a24; /* Elevated Pandal Card surface */
    --color-bg-elevated: #1d2636; /* Interactive elements & drawers */
    --color-border: #2a364b; /* Basalt border with subtle contrast */
    --color-border-subtle: #1c2433;

    /* Primary Ceremonial Accents */
    --color-vermillion: #e63920; /* Sindoor Red: Primary brand & map pins */
    --color-vermillion-glow: rgba(230, 57, 32, 0.35);
    --color-marigold: #f5a623; /* Amber Gold: Secondary accent & star ratings */
    --color-marigold-subtle: rgba(245, 166, 35, 0.15);

    /* Text & Legibility */
    --color-text-primary: #f8fafc; /* High-contrast crisp white */
    --color-text-secondary: #94a3b8; /* Muted stone gray for metadata */
    --color-text-tertiary: #64748b; /* De-emphasized footnotes */

    /* Crowd Indicators */
    --color-crowd-low: #10b981; /* Emerald Green (< 30 mins) */
    --color-crowd-moderate: #f59e0b; /* Amber (30m - 1 hr) */
    --color-crowd-heavy: #f97316; /* Flame Orange (1 hr - 3 hrs) */
    --color-crowd-critical: #ef4444; /* Crimson Red (3 hrs+) */
}
```

---

## 3. Typography: Bilingual Harmony

To avoid the disjointed look common in bilingual Indian websites, we pair a modern geometric Latin face with an authentic, locally-designed Devanagari typeface:

| Hierarchy            | Latin Typeface    | Devanagari Typeface                 | Weight                       | Usage                                  |
| :------------------- | :---------------- | :---------------------------------- | :--------------------------- | :------------------------------------- |
| **Display / Hero**   | Plus Jakarta Sans | Tiro Devanagari Marathi             | SemiBold (600) / Bold (700)  | Main hero title, mandal names on cards |
| **Body / UI**        | Plus Jakarta Sans | Mukta (designed by Ek Type, Mumbai) | Regular (400) / Medium (500) | Descriptions, filter labels, reviews   |
| **Monospace / Data** | JetBrains Mono    | —                                   | Regular (400)                | Coordinates, timestamps, founded years |

### Typography Licenses:

- **Mukta:** SIL Open Font License 1.1 (designed specifically by Girish Dalvi & Yashodeep Gholap in Mumbai for multi-script parity).
- **Tiro Devanagari Marathi:** SIL Open Font License 1.1 (supports authentic Marathi ligature forms like the traditional 'ल' and 'श').
- **Plus Jakarta Sans:** SIL Open Font License 1.1.

---

## 4. Custom Map Styling (Anti-Default Policy)

Using a default OpenStreetMap or standard Google Maps tile style is strictly forbidden. The map is custom-themed to blend seamlessly into the site’s dark basalt visual identity:

1. **Waterbodies (Arabian Sea, Back Bay, Mumbai Harbour):** Custom deep midnight navy (`#070A10`).
2. **Landmass:** Basalt dark charcoal (`#0F141D`).
3. **Road Hierarchy:**
    - Arterial highways / Coastal Road / Flyovers: Subtly warm slate (`#263346`).
    - Local streets & alleyways (_gallis_): Faint hairline charcoal (`#1A2230`).
4. **Labels:** Clean, low-contrast slate-gray typography with collision detection enabled so mandal pins always take visual precedence.
5. **Pins:** Custom SVG markers featuring an authentic ceremonial kalash / modak crest rendered in luminous vermillion (`#E63920`) with an organic CSS pulse animation.

---

## 5. Motion Principles & Lightweight WebGL

1. **Purposeful Motion Only:** Motion must only serve functional feedback (camera pan when a card is selected, modal drawer reveal, subtle hover feedback on touch targets).
2. **Hero Atmospheric Background:**
    - Instead of heavy 3D packages (`three.js`, `@react-three/fiber` which add 500+ kB), the hero background uses a **lightweight ~3 kB custom WebGL fragment shader** or an SVG radial mesh gradient.
    - The shader renders subtle ambient currents resembling incense smoke and festival lantern light.
    - Automatically pauses rendering when the hero scrolls out of view (`IntersectionObserver`).
3. **Accessibility:** Enforces `@media (prefers-reduced-motion: reduce)`. When active, WebGL frame rendering halts completely and map transitions occur instantaneously.

---

## 6. Reference Board & Component Sourcing

| Reference             | What Was Borrowed & Why                                                   | What Was Rejected & Why                                                                         | License / Status                                                                      |
| :-------------------- | :------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **Unicorn Studio**    | Atmospheric ambient illumination and organic interactive lighting.        | The proprietary runtime script and mandatory watermark branding on the free tier.               | Rejected proprietary embed. Implemented via custom native WebGL shader.               |
| **ShaderGradient.co** | Elegant continuous color warping for hero visuals.                        | Massive Three.js dependencies (500+ kB bundle size) that cripple mobile browsers on crowded 4G. | Rejected Three.js bundle. Replaced with custom lightweight GLSL.                      |
| **Aceternity UI**     | Bento grid hierarchy, responsive collapsible filter drawer layout.        | Overly decorative floating particles that add distraction without user value.                   | Permissive commercial license for free components; custom implementation in Tailwind. |
| **Skiper UI**         | Micro-interaction button states.                                          | Mandatory brand attribution requirement on free components.                                     | Rejected; replaced with unbranded Radix UI accessible primitives.                     |
| **Radix UI / shadcn** | Accessible, unstyled dialogs, dropdowns, and drawers (WCAG AA compliant). | Default monochromatic grayscale theme.                                                          | MIT License; restyled with our custom palette.                                        |

---

## 7. Anti-Slop Audit Checklist

Before any component is marked as complete, it must satisfy this checklist:

- [x] **No generic purple-blue gradient heroes:** Background is rooted in South Mumbai basalt charcoal and ceremonial vermillion.
- [x] **No unmodified component library defaults:** All dialogs, cards, and buttons use custom design tokens and border radii.
- [x] **No emoji used as icons:** High-quality Lucide SVG icons used exclusively with proper `aria-hidden` attributes.
- [x] **No lorem ipsum or placeholder text:** All mandal descriptions, addresses, and history reflect verified cultural facts.
- [x] **No fake testimonials or fabricated crowd statistics:** Seed reviews and crowd data are explicitly sourced or marked as initial baselines.
- [x] **No motion for show:** Animations are under 250ms, ease-out, and respect `prefers-reduced-motion`.
- [x] **No un-styled default map tiles:** MapLibre style JSON is explicitly customized with brand colors and high-contrast night aesthetics.

---

## 8. Document Cross-References

- [01-PRD.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/01-PRD.md) — Product vision and requirements.
- [05-frontend-prd.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/05-frontend-prd.md) — Component contracts and performance budgets.
- [07-content-and-data.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/07-content-and-data.md) — Verified cultural data and mandal names.
