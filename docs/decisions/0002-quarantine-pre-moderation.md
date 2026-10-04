# ADR 0002: Pre-Moderation Quarantine Pipeline for User Submissions

## Status

Accepted (Approved at Gate 1)

## Context

During Ganeshotsav, public websites experience heavy traffic and potential abuse vectors, including coordinate tampering, promotional spam, and offensive or non-consensual images. Allowing instant public publishing with post-moderation poses unacceptable trust and safety risks.

## Decision

All community submissions (reviews, crowd updates, photo uploads, and mandal edit suggestions) enter the database with `moderation_status = 'pending'`.

- Photos are uploaded to a private quarantine R2 bucket (`bappamap-quarantine`).
- Automated pre-filters (Turnstile bot check, honeypot, trilingual profanity regex) discard abusive submissions automatically.
- Only authenticated maintainers via the `/admin` portal can promote a record from `pending` to `published`.
- On approval, photos are promoted to the public CDN bucket (`bappamap-public`) and edge cache is purged.

## Consequences

- **Positive:** Zero spam or offensive imagery can appear on the public map. Complete content integrity is maintained.
- **Negative:** Submissions do not appear instantly, requiring active maintainer moderation during peak festival hours.
