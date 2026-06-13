# MoT+++ Site — Open Issues

Claude Code should read this file at the start of every session and flag any open items relevant to current work.

## Open

### [ISSUE-001] Alec Schachner profile corrections
**Reported:** 2026-06-12
**Updated:** 2026-06-13
**Priority:** medium
**Status:** partially resolved — awaiting final bio text and confirmation of curator credits from artist

Resolved 2026-06-13 (commit see `fix: Alec Schachner display name and data cleanup`):
- Display name set to "Alec Schachner (Scobi Wan)".
- Discovered + consolidated a DUPLICATE: two Sanity artist docs existed for the
  same person — `scobi-wan` (active, 6 MoTsound event refs, but holding a
  corrupted bio that was actually a mashup of three OTHER artists' bios) and
  `alec-schachner` (inactive stub, accurate bio, 0 refs). Canonical is now
  `alec-schachner` (active, correct bio). All 6 event refs re-pointed to it.
  `scobi-wan` retired (active:false, wrong bio cleared) + worker.js 301
  `/profiles/scobi-wan` → `/profiles/alec-schachner`.
- Lee Wen workshop connection removed. Root cause: it was never an event ref —
  "lee wen (singapore)" was a fragment of Aliansyah Caniago's bio wrongly
  stitched into the `scobi-wan` bio, then surfaced via the old name-matching.
  Name-matching is deleted (RESOLVED-004) and the corrupted bio is cleared, so
  the association is fully gone.
- Bio source: used the accurate bio already on the stub (nothing+ trio, ếch ếch
  studios, 97 water bottles, saigon→hanoi). Confirmed in event copy too
  (mot-sound-13 desc: "Scobi Wan, aka Alec Schachner, ongoing curator…").

Still open (blocked on artist):
- Final/authoritative bio text — current bio is accurate but may be superseded
  by the artist's own copy.
- Missing curator/performer credits. He is NOT in artists-data.json (Sanity-only).
  Candidate Sanity events that name him but do NOT yet ref his doc, pending
  artist confirmation before adding `artists[]` refs:
  - `mot-sound-5` — performer (Nothing+ trio, with ben-litwicki + van-thanh-trung)
  - `mot-sound-7` — named in event copy
  - `mot-sound-16-poetry-plus-vol-3` — credited as MoTsound curator
- Currently connected events (all correct, none flagged): mot-sound-1, -2, -4,
  -9-aconvergence, -10-anoise, -13-amoment.

### [ISSUE-002] R2 bucket migration
**Reported:** 2026-06-12
**Priority:** medium — not urgent but needed for clean separation
**Status:** blocked — new MoT+++ R2 bucket created but not yet configured

All MoT+++ image URLs currently point to the personal walther.website R2 bucket (pub-1a24c863e9654cf59be6136420ba1770.r2.dev).
Once the new MoT+++ bucket public URL is confirmed:
- Copy all MoT+++ images to new bucket
- Update all Sanity event and artist docs with new URLs
- Update any hardcoded references in codebase

### [ISSUE-003] PLUS1_RESIDENCY_SLUGS empty
**Reported:** 2026-06-12
**Priority:** low-medium
**Status:** open — requires WP XML scan

PLUS1_RESIDENCY_SLUGS in lib/badges.ts is empty so the "+1 residency" badge never renders. Populate from WordPress XML export at:
/Volumes/MoT/EXPORTED DATA/wordpress/motplusplusplus.wordpress.com-2026-03-17-04_52_48/

### [ISSUE-004] deathYear field not wired
**Reported:** 2026-06-12
**Priority:** low
**Status:** open

deathYear field added to Sanity schema and populated for lan-anh-le and dinh-q-le but check whether it is being queried by ARTIST_FIELDS in lib/sanity.ts and rendering correctly on bio pages.

### [ISSUE-005] Sanity role enum
**Reported:** 2026-06-12
**Priority:** low
**Status:** open

Sanity artist role field is still free-text. Adding an enum would prevent typos and make badge logic more reliable. Requires schema change and Studio deploy.

### [ISSUE-006] Retire JSON flags from computeBadges
**Reported:** 2026-06-12
**Priority:** low
**Status:** open

resident, curator, performancePlus flags in artists-data.json still feed computeBadges(). Once Sanity has reliable role/badge data these should be removed and badge logic reads purely from Sanity.

### [ISSUE-007] studios-data.json migration
**Reported:** 2026-06-12
**Priority:** low
**Status:** open

hostSlug, locationKeywords, portraitPairs, video URLs still live in studios-data.json. Requires Sanity schema additions for afarmHost type before migrating.

### [ISSUE-009] Empty bios pending artist-supplied content
**Reported:** 2026-06-13
**Priority:** low
**Status:** open — content gathering, not a defect

As part of the ISSUE-008 cleanup (see RESOLVED-007), the docs below had
corrupted/misassigned bio text removed, and no real replacement text could be
found in `events-data.json`, `artists-data.json`, or `CONTENT-ARCHIVE.md`.
Their `bio` field is now empty (unset) pending text supplied by the artist:

`sonar-lee`, `nguyen-giao-xuan`, `sto-len`, `kin`, `anh-tran`, `hien-tran`,
`mai-thi-tran`, `thy-tran`, `llama-olo`, `espen-iden`, `lu-nguyen`,
`carl-stone`, `tran-van-thao`, `ngo-dinh-bao-chau`, `chicko`, `nguyen-van-du`,
`annie-thao-phan`, `ken-ueno`, `ho-tuong-danh`, `ayano-otani`, `duy-bao`,
`fad-plastic`, `lys-bui`.

### [ISSUE-010] Likely duplicate artist profiles
**Reported:** 2026-06-13
**Updated:** 2026-06-13
**Priority:** medium
**Status:** partially resolved — writher/nguyen-hong-giang done; dan-nguyen pair still open

Discovered while researching real bio text for ISSUE-008 Category B.

Resolved 2026-06-13:
- **`nguyen-hong-giang` vs `writher`** — two Sanity `artist` docs for the same
  person (Writher / Nguyễn Hồng Giang). Consolidated into canonical
  `nguyen-hong-giang` (_id=6143fbfe-5a8f-405a-876a-4558d1e0d449, now 32 event
  refs spanning his whole history, including mot-sound-25). `writher`
  (_id=d0fd76ff-6ca7-40d2-9ff7-fa1eb63b507a) had its 1 event ref
  (mot-sound-25) re-pointed to `nguyen-hong-giang`, set to `active:false`,
  and had its (truncated-fragment) bio cleared. Added worker.js 301
  `/profiles/writher` → `/profiles/nguyen-hong-giang/`, following the
  scobi-wan/alec-schachner precedent (RESOLVED-005-style consolidation under
  ISSUE-001).

Still open — needs human confirmation before retiring/redirecting:

- **`dan-nguyen` vs `dan-nguyen-demonslayer`** — `dan-nguyen` is a Sanity
  `artist` doc (_id=89c1428d-b8f0-4b3d-af80-22f43a336c3f, now carries the real
  "Dan Nguyen (Demonslayer)" bio recovered from `artists-data.json`).
  Separately, `dan-nguyen-demonslayer` is in `BIO_SLUGS` (`lib/events.ts`) with
  its own `artists-data.json` entry holding the *same* bio text, which (per
  ARCHITECTURE.md) generates its own `/profiles/dan-nguyen-demonslayer` page —
  likely a second page for the same person. Needs confirmation + consolidation
  (or a redirect) once a maintainer confirms these are the same person.

## Resolved

### [RESOLVED-001] All inquiry forms broken
Fixed: 2026-06-11 — replaced POST /submit-inquiry with mailto on all three forms (commit 299adc5)

### [RESOLVED-002] Deploy pipeline reversion
Fixed: 2026-06-11 — npm run deploy now self-contained with git checks (commit cf7ab9b)

### [RESOLVED-003] 82 JSON-only events not in Sanity
Fixed: 2026-06-12 — all events migrated, events-data.json is now archive (commit 6a0524e)

### [RESOLVED-004] matchParts name-matching
Fixed: 2026-06-12 — deleted entirely, all profile↔event links now via explicit Sanity refs (commit b75bc83)

### [RESOLVED-005] pug-alex-williams orphan
Fixed: 2026-06-11 — consolidated into alex-williams with 301 redirect (commit 5354c73)

### [RESOLVED-006] Luke Schneider in site data
Fixed: 2026-06-11 — purged from all site-facing sources (commit 5354c73)

### [RESOLVED-007] Systematic bio corruption across artist docs (ISSUE-008)
Fixed: 2026-06-13 — Categories A, B, and C all cleared/replaced (commit "fix: clear corrupted bios, all categories A/B/C (ISSUE-008)")

**A. MISASSIGNED bios** (another artist's bio verbatim) — bio unset for
`sonar-lee`, `nguyen-giao-xuan`, `sto-len`, `kin`, `anh-tran`, `hien-tran`,
`mai-thi-tran`, `thy-tran`, `llama-olo`, `espen-iden`. `anh-vo` kept its one
real sentence ("anh vo is a vietnamese choreographer and writer based in
brooklyn, ny.") with the leaked season-4 open-studio roster text removed.
Source docs `lap-xuan`, `tran-minh-duc`, `ngo-thanh-bac`, `aliansyah-caniago`
were confirmed correct and left untouched.

**B. EVENT-TEXT-AS-BIO** — real personal bio recovered from
`events-data.json` / `artists-data.json` and written in for: `hoang-vu`,
`dan-nguyen`, `duy-nguyen`, `vuong-thien`, `bill-nguyen`, `nguyen-hoa`,
`nguyen-hong-giang`, `mathieu-dufourg`, `tobias-ahlbrecht`, `nguyen-chung`. No
real bio text could be found for `lu-nguyen`, `carl-stone`, `tran-van-thao`,
`ngo-dinh-bao-chau`, `chicko`, `nguyen-van-du`, `annie-thao-phan`, `ken-ueno`,
`ho-tuong-danh`, `ayano-otani`, `duy-bao` — bio unset (see ISSUE-009).

**C. STITCHED/PRONOUN-SWITCH fragments** — no real personal bio found for
`fad-plastic` or `lys-bui`; bio unset (see ISSUE-009).

Re-ran `scripts/scan-bios.mjs` after all fixes: none of the above slugs appear
in the corrupted/event-blurb output anymore. Two of the new real bios
(`dan-nguyen`, `bill-nguyen`) now trigger OWN-NAME-ABSENT / OWN-NAME-LATE —
same false-positive pattern as `aliansyah-caniago` (legit third-person bio
that doesn't restate the subject's name up front).

**Known FALSE POSITIVES the scan also flags — do NOT touch (bios are
correct):** legit third-person bios that simply don't restate the artist's
name (`felipe-calderon-nurmi`, `van-thanh-trung`, `nic-ford`,
`doan-thanh-toan`, `nguyen-thuy-tien`, `quoc-anh-le`, `tran-kim-ngoc`,
`mr-bambii`, `luu-chu`, `douglas-schmidt`, `attiss-ngo`, `hoai-anh`, `mai-anh`,
`chinh-ba`, `nguyen-do-minh-quan`, `vu-duc-toan`, `pamela-n-corey`,
`aliansyah-caniago`, `bagus-mazasupa-anwarridwan`, `tanya-amador`,
`dan-nguyen`, `bill-nguyen`); real duo bio (`z1-studio`); residency/foreign-geo
mentions (`le-phi-long`, `truong-tan`); and the intentional `[stub …]`
placeholders (`tran-phuong-thao`, `que`).

Two likely duplicate artist profiles were discovered during Category B
research (`writher`/`nguyen-hong-giang` and `dan-nguyen`/`dan-nguyen-demonslayer`)
— tracked separately as ISSUE-010, not fixed here.
