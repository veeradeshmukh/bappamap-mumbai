# ADR 0006: Client-Side EXIF Stripping & WebP Normalization

## Status

Accepted (Approved at Gate 1)

## Context

Photographs taken on modern smartphones embed detailed Exchangeable Image File Format (EXIF) metadata, including precise GPS coordinates (latitude, longitude, altitude), camera serial numbers, device models, and timestamps. Uploading raw files exposes user privacy and wastes cellular bandwidth on bloated multi-megabyte payloads. Furthermore, serverless edge workers (Cloudflare Workers) do not support native C libraries like `sharp` without heavy WebAssembly overhead.

## Decision

All devotee image uploads are processed entirely **in-browser on the client device** using the HTML5 2D Canvas API prior to transmission:

1. The raw image is decoded into an `ImageBitmap`.
2. The image is rendered to an offscreen canvas and downscaled to a maximum of 1600px along its longest edge.
3. The canvas is exported via `canvas.toBlob('image/webp', 0.82)`.
4. Exporting via standard HTML5 Canvas permanently strips 100% of EXIF, GPS, camera metadata, and ICC profiles.
5. Only the sanitized WebP blob is sent over the network to the `/api/submissions` endpoint.

## Consequences

- **Positive:** Zero server-side image processing costs, zero risk of leaking contributor location metadata, reduced upload bandwidth by up to 80% on congested 4G connections.
- **Negative:** Minor client CPU spike during the 100–250ms canvas re-encoding on low-end smartphones.
