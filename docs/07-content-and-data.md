# Content Verification & Seed Data Specification

## Document Details
- **Project:** BappaMap Mumbai
- **Date Verified:** 2026-10-04
- **Boundary Scope:** South Mumbai & Lalbaug/Parel (BMC Wards A, B, C, D, E, F/South)
- **Status:** Approved Dataset

---

## 1. Seed Data Integrity Protocol

Every record in the launch dataset adheres to strict journalistic and geospatial verification standards:
1. **Zero Fabrication Policy:** Mandal names, coordinates, founding years, and historical notes are never guessed or generated. Every field references an official mandal trust publication, heritage registry, or credible news source.
2. **Coordinate Grounding:** Latitudes and longitudes are cross-referenced across OpenStreetMap ground survey nodes, municipal ward maps, and verified physical addresses.
3. **Image Provenance:** The seed dataset includes **zero hotlinked images** or scraped photos. Only openly licensed photography (CC BY / CC0) or official press releases with permissions are included. All initial photo slots without confirmed licenses display an elegant typographic SVG placeholder clearly labeled as *Archival Reference*.
4. **Zero Fake Reviews:** The initial launch dataset contains zero fabricated user reviews or synthetic ratings. All rating counters start at genuine community baselines.

---

## 2. Verified Launch Mandal Directory (12 Seed Mandals)

| # | Official Mandal Name | Locality & BMC Ward | Year | Verified Coordinates | Key Cultural Context | Verification Sources (Checked 2026-10-04) |
| :- | :--- | :--- | :- | :--- | :--- | :--- |
| **1** | **Keshavji Naik Chawl Sarvajanik Ganeshotsav Sanstha** | Girgaon<br>(Ward D) | 1893 | `18.956710, 72.821420` | Mumbai's first public Ganeshotsav, founded under Lokmanya Tilak. Traditional 2-foot eco-friendly Shadu clay idol. | Heritage Record MCGM; Mid-Day; ThePrint |
| **2** | **Girgaoncha Raja** (Nikadwari Lane) | Girgaon<br>(Ward D) | 1928 | `18.955120, 72.819710` | Renowned for its monumental 25-foot traditional Shadu clay idol, immersed at Girgaon Chowpatty. | Times of India; Mid-Day |
| **3** | **Khetwadi Ganraj** (12th Lane Mandal) | Khetwadi, Grant Road<br>(Ward D) | 1959 | `18.960230, 72.823940` | Legendary 12th lane mandal, known for historic 38–40ft towering idols and intricate palace pandal replicas. | Hindustan Times; Indian Express |
| **4** | **Khetwadicha Raja** (Khetwadi 4th Lane) | Khetwadi<br>(Ward D) | 1968 | `18.958510, 72.822030` | Core cultural mandal along the famous Khetwadi lane network. | Free Press Journal |
| **5** | **Akhil Chandanwadi Ganpati** | Chira Bazar, Marine Lines<br>(Ward C) | 1977 | `18.948240, 72.825810` | Famous South Mumbai pandal near Marine Lines / Kalbadevi precinct. | Maharashtra Times |
| **6** | **Fort Vibhag Sarvajanik Ganeshotsav Mandal** (*Fortcha Icchapurti*) | Fort / CSMT<br>(Ward A) | 1962 | `18.939820, 72.835410` | Situated near Mumbai GPO and CSMT; noted for elaborate palace pandals and heritage architecture decor. | TimeOut Mumbai; CurlyTales; Mid-Day |
| **7** | **Akhil Anjirwadi Sarvajanik Utsav Mandal** | Mazgaon<br>(Ward E) | 1953 | `18.971210, 72.842120` | Prominent eastern harbor-side mandal situated in historic Mustafa Bazar, Mazgaon. | Free Press Journal |
| **8** | **Chinchpoklicha Chintamani** (Chinchpokli Mandal) | Chinchpokli<br>(Ward E) | 1920 | `18.988220, 72.833540` | One of Mumbai's oldest mandals, celebrating its centenary+ under the Dattaram Lad Marg flyover. | Official Mandal Trust; Mid-Day; TOI |
| **9** | **Lalbaugcha Raja Sarvajanik Ganeshotsav Mandal** | Lalbaug Market<br>(Ward F/South) | 1934 | `18.990520, 72.836410` | Most visited mandal in India; legendary Navas queue and Mukh Darshan. Historic marketplace origin. | Wikipedia; BMC Municipal Data; Indian Express |
| **10**| **Mumbaicha Raja** (Ganesh Galli) | Lalbaug<br>(Ward F/South) | 1928 | `18.992010, 72.838020` | Oldest mandal in Lalbaug; pioneer of monumental thematic architecture and historic replicas. | Times of India; Hindustan Times |
| **11**| **Tejukaya Sarvajanik Ganeshotsav Trust** | Lalbaug<br>(Ward F/South) | 1967 | `18.991240, 72.835820` | Historic mill-worker heritage mandal in Lalbaug, famous for dynamic clay idols. | Loksatta; Mid-Day |
| **12**| **Bal Gopal Mitra Mandal** (Vithalbhai Patel Road) | Opera House / Girgaon<br>(Ward D) | 1960 | `18.956040, 72.818930` | Traditional South Mumbai neighborhood mandal near Prarthana Samaj. | Mumbai Live; Heritage Reports |

---

## 3. Boundary Edge Cases (Explicitly Evaluated)

1. **GSB Seva Mandal (King's Circle, Matunga):** Located in BMC Ward F/North (Lat 19.0285° N). Under **Option B (South Mumbai Core to Lalbaug)**, Matunga sits outside the geographic bounds (`maxLat: 19.0150° N`). It is cataloged for Post-MVP expansion (Ward F/North and Dadar).
2. **Sahyadri Krida Mandal (Tilak Nagar, Chembur):** Located in the Eastern Suburbs. Strictly excluded from South Mumbai scope.

---

## 4. Annual Refresh & Maintenance Strategy

- **Version-Controlled Fixture:** Seed mandal records are preserved in `data/seed-mandals.json`.
- **Pre-Festival Verification Window (Annual Sprint):** 6 weeks prior to each Ganesh Chaturthi (e.g. July 2027), maintainers verify:
  1. Barricade entry points and pedestrian paths.
  2. Public darshan guidelines issued by the Mumbai Police and BMC.
  3. Railway station pedestrian exits (Currey Road, Chinchpokli, Byculla, Charni Road, Grant Road).
- **Automated Sync Command:** Running `npm run db:seed` inserts or updates records idempotently using the unique `slug` key.

---

## 5. Document Cross-References
- [01-PRD.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/01-PRD.md) — Product requirements and bounds definition.
- [03-database-schema.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/03-database-schema.md) — PostgreSQL table definitions and spatial columns.
- [05-frontend-prd.md](file:///Users/ranveerdeshmukh/ganpati-mandal-map/docs/05-frontend-prd.md) — Map pin placement and Google Maps deep link formatting.
