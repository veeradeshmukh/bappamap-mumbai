# ADR 0005: Bilingual Marathi & English Foundation

## Status

Accepted (Approved at Gate 1)

## Context

Ganeshotsav is deeply rooted in Maharashtra's cultural and linguistic identity. While English serves national and international tourists, local devotees, mandal volunteers, and police notices in South Mumbai communicate primarily in Marathi. Deferring Marathi localization to a post-MVP phase would alienate the core devotee audience.

## Decision

BappaMap launches with **native bilingual support (English and Marathi)** from Day 1:

1. All seed mandals include verified names, localities, and descriptions in both scripts.
2. UI strings are localized using a lightweight key-value dictionary.
3. Typography utilizes **Mukta** (designed by Ek Type in Mumbai) and **Tiro Devanagari Marathi** (authentic Marathi orthography) alongside Plus Jakarta Sans.
4. User language preference is stored in `localStorage` and synchronized via URL query parameter (`?lang=mr`).

## Consequences

- **Positive:** Deep community trust, authenticity, and immediate adoption among local Mumbai residents and mandal workers.
- **Negative:** Form submissions require dual-script input support or translation workflow during admin review.
