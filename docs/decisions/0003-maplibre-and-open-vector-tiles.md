# ADR 0003: Selection of MapLibre GL JS and Open Vector Tiles

## Status

Accepted (Approved at Gate 1)

## Context

Commercial mapping APIs (such as Google Maps JavaScript API) incur recurring per-map-load fees that quickly escalate during viral festival spikes. Additionally, MapTiler and Stadia Maps forbid commercial use on their free tiers and impose hard request caps. Using the OpenStreetMap public tile servers (`tile.openstreetmap.org`) is strictly prohibited by OSMF's Tile Usage Policy for mobile apps and high-traffic sites.

## Decision

1. We use **MapLibre GL JS** (v4.x/5.x, BSD-3-Clause) as the client map engine.
2. For the MVP, we use **OpenFreeMap** public vector tiles (unlimited free usage, no API key, ODbL attribution compliant).
3. For production hardening, we extract a South Mumbai bounding box archive (`.pmtiles`, ~10–15 MB) using the open Protomaps format and host it on **Cloudflare R2** with HTTP Range Requests, eliminating all third-party tile dependencies.
4. Pin navigation buttons open external Google Maps via the documented, free universal URL scheme: `https://www.google.com/maps/search/?api=1&query={lat}%2C{lng}`.

## Consequences

- **Positive:** Zero recurring map API costs, zero vendor lock-in, crisp vector rendering on mobile Retina screens, complete control over night-mode map styling.
- **Negative:** Slightly higher initial JS bundle (~278 kB min+gzip) compared to raster Leaflet (~42 kB), mitigated by lazy-loading the map component.
