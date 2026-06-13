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
