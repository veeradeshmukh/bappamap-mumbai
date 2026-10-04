# ADR 0001: South Mumbai Geographic Bounding Definition

## Status

Accepted (Approved at Gate 1)

## Context

South Mumbai's boundaries can be defined strictly by colonial/revenue boundaries (BMC Wards A through E, ending at Byculla/Haji Ali at Lat 18.975° N) or culturally. Several of the most famous Ganeshotsav mandals in Mumbai (Lalbaugcha Raja, Ganesh Galli / Mumbaicha Raja, Tejukaya) reside in Lalbaug/Parel (BMC Ward F/South), just north of Byculla. Excluding them would make the map feel incomplete to devotees; however, expanding the map to the entire metropolitan region would dilute focus and violate the South Mumbai requirement.

## Decision

We adopt **Option B: Cultural South Mumbai / Historic Core**:

- Southern boundary: Colaba coastline (`Lat 18.8900° N`)
- Northern boundary: Parel / Lalbaug railway corridor (`Lat 19.0150° N`)
- Western boundary: Arabian Sea / Malabar Hill (`Long 72.7800° E`)
- Eastern boundary: Mumbai Harbour / Mazgaon docks (`Long 72.8700° E`)

BMC Wards covered: A, B, C, D, E, and F/South.

## Consequences

- **Positive:** Captures all iconic South Mumbai and Lalbaug festival mandals while maintaining a strict, non-bypassable viewport bounds box.
- **Negative:** Mandals further north (such as GSB Seva Mandal in Matunga, Ward F/North) are excluded from the initial map bounds, but cataloged for future post-MVP geographic expansion.
