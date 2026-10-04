# ADR 0004: Hybrid Contributor Identity with Cloudflare Turnstile

## Status
Accepted (Approved at Gate 1)

## Context
Forcing visitors to create an account or sign in with OAuth before submitting a quick crowd report or review creates high friction, especially on congested cellular networks in festival crowds. Conversely, fully unauthenticated open endpoints invite automated bot spam.

## Decision
We implement a **Hybrid Identity Model**:
- **Public Submissions (Reviews, Photos, Edits):** Completely anonymous. Protected by **Cloudflare Turnstile** invisible bot verification, client honeypots, and salted IP rate limiting. Users optionally provide a display nickname.
- **Maintainer / Admin Operations:** Authenticated using Supabase Auth (magic link / email OTP) with strict role-based access control.

## Consequences
- **Positive:** Maximum community participation with minimum barrier to entry; strong protection against automated botnets without frustrating users with captcha image puzzles.
- **Negative:** Submissions cannot be edited retroactively by anonymous authors once submitted.
