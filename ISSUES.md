# MoT+++ Site — Open Issues

Claude Code should read this file at the start of every session and flag any open items relevant to current work.

## Open

### [ISSUE-001] Alec Schachner profile corrections
**Reported:** 2026-06-12
**Updated:** 2026-06-13
**Priority:** medium
**Status:** partially resolved — awaiting final bio text from artist

Resolved 2026-06-13:
- Added missing `artists[]` refs to `alec-schachner` for three events that
  name him in their copy but didn't yet reference his doc: `mot-sound-5`
  (performer, Nothing+ Trio with ben-litwicki + van-thanh-trung),
  `mot-sound-7` (named as Hanoi-based sound artist in collaboration with
  Alex McCarl), and `mot-sound-16-poetry-plus-vol-3` (credited as MoTsound
  curator). `alec-schachner` now has 9 event refs total (was 6).

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
- He is NOT in artists-data.json (Sanity-only) — low priority, profile already
  renders fully from Sanity.
- Currently connected events (all correct, none flagged): mot-sound-1, -2, -4,
  -5, -7, -9-aconvergence, -10-anoise, -13-amoment, -16-poetry-plus-vol-3.

### [ISSUE-003] PLUS1_RESIDENCY_SLUGS empty
**Reported:** 2026-06-12
**Updated:** 2026-06-15
**Priority:** low-medium
**Status:** open — BLOCKED on external drive `/Volumes/MoT` being mounted

PLUS1_RESIDENCY_SLUGS in lib/badges.ts is empty so the "+1 residency" badge never renders. Populate from WordPress XML export at:
/Volumes/MoT/EXPORTED DATA/wordpress/motplusplusplus.wordpress.com-2026-03-17-04_52_48/

**2026-06-14 (overnight):** attempted the scan but `/Volumes/MoT` is **not mounted**
(WD external drive offline), so the WP XML export is inaccessible. Task skipped.
Re-attempt once the drive is mounted. Note also `lib/badges.ts` already flags two
*unconfirmed* candidates in a comment (`dao-tung`, `tran-minh-duc`) that appear in the
"+1 museum" collection but are NOT confirmed residents — do not add without XML confirmation.

**2026-06-15:** re-checked (`ls /Volumes/MoT`) — still **not mounted**. No further
action possible from this machine; re-attempt next session once the drive is
connected and mounted.

### [ISSUE-005] Sanity role enum
**Reported:** 2026-06-12
**Priority:** low
**Status:** open

Sanity artist role field is still free-text. Adding an enum would prevent typos and make badge logic more reliable. Requires schema change and Studio deploy.

### [ISSUE-006] Retire JSON flags from computeBadges
**Reported:** 2026-06-12
**Updated:** 2026-06-14
**Priority:** low
**Status:** open — audited; blocked on Sanity data gaps (no flag safely retirable yet)

resident, curator, performancePlus flags in artists-data.json still feed computeBadges(). Once Sanity has reliable role/badge data these should be removed and badge logic reads purely from Sanity.

**Audit 2026-06-14** (cross-referenced every JSON flag against live Sanity;
findings also recorded inline in `lib/badges.ts` above `PersonSignals`):
- **resident** — 72 JSON-flagged; **12** have NO Sanity `residencyStartDate`/
  `isAfarmResident` (`perrine-lievens`, `celina-huynh`, `lai-dieu-ha`,
  `maxime-brygo`, `phuong-gio`, `bang-nhat-linh`, `ngo-thanh-bac`,
  `weston-teruya`, `baby-reni`, `enkhbold-togmidshiirev`, `lap-xuan`,
  `duong-tu-que`). **Exit criteria:** set a residency signal on these 12 in
  Sanity, then drop the `jsonResidentSlugs`/`artist.resident` fallback.
- **performancePlus** — 43 JSON-flagged; **no Sanity field exists**. **Exit
  criteria:** add an `isPerformancePlus` boolean to the `artist` schema +
  backfill, then drop the JSON flag.
- **curator** — only 3 JSON-flagged (`karlie-ho`, `linh-le`, `david-willis`);
  Sanity `role` already covers `linh-le` + `david-willis`; **`karlie-ho`** has
  an empty Sanity role and empty bio (curator status unverifiable). **Exit
  criteria:** set `karlie-ho`'s Sanity `role` (if confirmed curator), then drop
  the `artist.curator ? "curator" : null` fallback at both call sites.

No flag was removed this session — each still covers cases Sanity does not.

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

### [ISSUE-012] 315 R2 keys referenced but missing from source (follow-up to RESOLVED-009)
**Reported:** 2026-06-15
**Updated:** 2026-06-16
**Priority:** see breakdown — 1 HIGH (unresolved), 267 LOW
**Status:** partially resolved — 28/29 HIGH fixed 2026-06-15; all 39 MEDIUM fixed 2026-06-16

During RESOLVED-009's migration audit, 315 of 2,686 referenced R2 keys were
already missing from the old `site-general` bucket — pre-existing broken
links unchanged by the migration (`scripts/r2-migration-missing.json`). Each
was classified by where it's referenced and how visible the breakage is:

**HIGH (29) — event thumbnails/cards, rendered on listing pages.** All 29
checked against `site-general` for an alternate filename (different
extension/case, same stem).

- **28/29 resolved 2026-06-15:** `.jpg`/`.jpeg` alternates with matching stems
  found in `site-general`, copied to `mot-assets` under the exact missing key
  name (e.g. `.../fb-event.jpg` → `.../fb-event.png`), `ContentType:
  image/jpeg`. Verified `.../fb-event.png` for
  `april-open-studio-virginie-tan-aylin-derya-stahl` returns HTTP 200 with
  correct content from `pub-136b7c559e56403eb674c24e717611c6.r2.dev`.
- **1/29 unresolved:** `motplus/events/studio-kim-duy/kd-1.jpg` — no plausible
  alternate exists in `site-general` (directory has 146 unrelated files:
  DSCF0764–0822, IMG_3834–3945, doc-1..4, logo.png — nothing matching the "kd"
  stem). Needs a real photo sourced from elsewhere (e.g. `/Volumes/MoT`) or
  the thumbnail field cleared on the `studio-kim-duy` event.

**MEDIUM — resolved 2026-06-16:** 39 keys across 10 event slugs
(`between-land-sea-ink-rock-paintings-by-saverio-tonoli` ×7,
`eta-estimated-time-of-arrival-film-screening` ×3, `living-today-for-tomorrow`
×3, `may-open-studio` ×7, `minimal-prayer-duy-nguyen` ×3 +
`minimal-prayer-duy-nguyen-vn` ×2, `nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do`
×3 + `-2` ×3, `saigon-dreaming-open-studio-by-ania-reynolds` ×3,
`sombras-nada-mas-shadows-nothing-more` ×3, `while-the-soil-slumbers-linh-san`
×2). All 39/39 resolved — `.jpg` alternates with matching stems found in
`site-general` for every key, copied to `mot-assets` under the exact missing
key names (`.jpeg`/`.png` target extensions preserved as referenced). Verified
6 sample keys return HTTP 200 from `pub-136b7c559e56403eb674c24e717611c6.r2.dev`.
Script: `scripts/r2-fix-medium-missing.mjs`; results log:
`scripts/r2-fix-medium-results.json`.

**LOW (267) — not user-impacting:**
- 145 — junk-image stems (`isJunkImage()` in `lib/junk-images.ts`) — filtered
  out of every gallery, never rendered regardless.
- 89 — `studios-data.json` "images" field — confirmed dead data; live studio
  pages read from Sanity `afarmHost.imageUrls` (already migrated), not this
  JSON field. Candidate for cleanup under ISSUE-007.
- 21 — slug has no corresponding `events-data.json` entry (orphaned
  reference, likely a removed/renamed event).
- 8 — event gallery images for events dated 2019 (pre-2020, low traffic).
- 3 — bare path prefixes (e.g. `motplus/contemporary`) extracted from a code
  constant, not real object keys — false positives.
- 1 — unrecognized path shape.

Full per-key data in `scripts/r2-migration-missing.json` (315 keys,
unchanged); classification breakdown was done in a scratch script, not
checked into the repo.

### [ISSUE-013] Cloudflare Workers Build auto-deploys on push with wrong build command
**Reported:** 2026-06-15
**Priority:** high
**Status:** partially resolved — build command fixed in dashboard, unconfirmed

The Cloudflare Workers Build git integration auto-deploys on every push to main.
The build command was set to "npm run build" (Turbopack) which does not inline
NEXT_PUBLIC_MAPBOX_TOKEN, causing the museum map to show a gray box / "map
unavailable" on every push-triggered build.

This was discovered on 2026-06-15 when two successive push-triggered auto-builds
(9781b870, 5b2f5861) clobbered manual deploys ~17-84s after each push, reverting
the live site to a tokenless Turbopack build.

Fix applied 2026-06-15 in Cloudflare dashboard (Workers & Pages → motplusplus-site
→ Settings → Build):
- Build command changed from "npm run build" to "npm run build -- --webpack"
- NEXT_PUBLIC_MAPBOX_TOKEN added as build environment variable

This is a dashboard-only change not visible in the repo. Cannot be confirmed until
the next push-triggered auto-build completes successfully.

**Workaround until confirmed:** after any git push, run `npm run deploy` twice —
once immediately, once ~2 minutes later to land after any rogue auto-build.

Note: the GitHub Actions "Deploy site" workflow is separate and had zero runs on
2026-06-15. The rogue deploys were Cloudflare Workers Build only.

## Resolved

### [ISSUE-010] Likely duplicate artist profiles
**Reported:** 2026-06-13
**Updated:** 2026-06-13
**Priority:** medium
**Status:** resolved — both consolidations complete

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

- **`dan-nguyen` vs `dan-nguyen-demonslayer`** — confirmed same person (Dan
  Nguyen aka Demonslayer, Vietnamese-American Vwave producer/DJ/visual
  artist). Canonical is `dan-nguyen` (Sanity `artist` doc,
  _id=89c1428d-b8f0-4b3d-af80-22f43a336c3f, active:true, 3 event refs
  2017–2024, carries the real "Dan Nguyen (Demonslayer)" bio).
  `dan-nguyen-demonslayer` (BIO_SLUGS/artists-data.json-only, no Sanity doc,
  0 event history) added to `CONSOLIDATED_BIO_SLUGS` in `lib/artists.ts` to
  exclude its standalone `/profiles/dan-nguyen-demonslayer` page, plus a
  worker.js 301 `/profiles/dan-nguyen-demonslayer` → `/profiles/dan-nguyen/`,
  mirroring the `pug-alex-williams` precedent (RESOLVED-005).

### [ISSUE-011] Live site served stale (April 2026) build for months — stale asset manifest + edge cache
**Reported:** 2026-06-13
**Updated:** 2026-06-13
**Priority:** ~~critical~~ → resolved (primary); one low-priority follow-up open
**Status:** RESOLVED 2026-06-13 — site now serves the current build. One optional hardening item remains (cache-purge token).

What looked like an edge-cache problem was actually **two compounding layers**.
Full diagnosis + fix in ARCHITECTURE.md §9.

**Layer 1 (primary, was invisible): stale static-asset manifest.** The worker
*script* updated on every deploy (301 redirects always reflected the latest
`worker.js`), but the deployed version kept serving the **April build's static
assets**. Proof: build-id-specific asset URLs — which cannot be edge-cache
artifacts — 404'd on the live site (`/_next/static/<NEW_BUILD_ID>/_buildManifest.js`
→ 404) while April chunks → 200. Two causes:
  1. **wrangler 4.68.0 asset-manifest bug** — `wrangler deploy` reported
     success ("Uploaded N files … Total Upload: 3.37 KiB") but the deployed
     version's asset manifest did not advance to the new build.
  2. **GitHub Action race** — the "Deploy site" workflow (fired by the Sanity
     Studio deploy button via `workflow_dispatch`, and `repository_dispatch`)
     re-deployed `origin/main` seconds after local deploys, and could clobber a
     good local deploy with a stale asset set (the asset-layer twin of
     RESOLVED-002's deploy-reversion hazard).

**Layer 2 (secondary, masking): zone "Cache Everything" rule.** HTML served
with `cf-cache-status: HIT` even with a random `?cb=` query (cache key ignores
query string) and `cache-control` rewritten from the worker's `private,no-store`
to `public, max-age=0, must-revalidate`. Because of `must-revalidate` the edge
revalidates each request, so once Layer 1 was fixed the HTML self-corrected —
which is why earlier "Purge Everything" attempts seemed not to help (they were
fighting Layer 1, the asset manifest, which a purge can't touch).

**Resolution (2026-06-13):**
- **Disabled the "Deploy site" GitHub Action** (`gh workflow disable` → state
  `disabled_manually`) so automation can no longer race/clobber deploys.
  ⚠️ Side effect: the Sanity Studio "deploy" button no longer triggers a build
  until the workflow is re-enabled. Re-enable only after the workflow is made
  safe (e.g. it deploys exactly the pushed `origin/main` and can't run stale).
- **Upgraded wrangler 4.68.0 → 4.100.0** (`devDependencies`). After the upgrade,
  a clean `rm -rf .next out && next build && wrangler deploy` made the asset
  manifest advance: new build-id assets now return **200** and the live
  homepage embeds the new BUILD_ID. Verified live = byte-identical to the local
  build (`/trash/`, `/profiles/dan-nguyen/`, homepage).
- **Rewrote `scripts/verify-deploy.js`** so this can never silently regress: it
  now fails loudly if the live site isn't serving the just-built BUILD_ID
  (fetches `/_next/static/<BUILD_ID>/_buildManifest.js` and checks the live
  homepage HTML embeds the BUILD_ID) **before** the existing >500 KB chunk
  checks.
- **Wired an edge-cache purge into `scripts/deploy.js`** (runs after deploy,
  before verify) gated on `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_CACHE_PURGE_TOKEN`
  from `.env.local`; warns and skips if not set.

**Remaining (low priority):** the deploy token still lacks `Zone > Cache Purge`
(API returns auth error 10000) and can't read/modify the zone cache ruleset
(needs `Zone > Cache Rules`). `CLOUDFLARE_ZONE_ID` is set in `.env.local` and
`CLOUDFLARE_CACHE_PURGE_TOKEN` is present but **blank** — until a Cache-Purge
token is created in the Cloudflare dashboard and pasted in, `npm run deploy`
prints a skip warning (harmless: `verify-deploy` still catches stale HTML). The
zone "Cache Everything" rule could also be narrowed to not Cache-Everything
`text/html`, but `must-revalidate` already keeps HTML fresh, so this is optional.

### [RESOLVED-001] All inquiry forms broken
Fixed: 2026-06-11 — replaced POST /submit-inquiry with mailto on all three forms (commit 299adc5)

### [RESOLVED-002] Deploy pipeline reversion
Fixed: 2026-06-11 — npm run deploy now self-contained with git checks (commit cf7ab9b)

### [RESOLVED-003] 82 JSON-only events not in Sanity
Fixed: 2026-06-12 — all events migrated, events-data.json is now archive (commit 6a0524e)

### [RESOLVED-004] matchParts name-matching
Fixed: 2026-06-12 — deleted entirely, all profile↔event links now via explicit Sanity refs (commit b75bc83)

### [RESOLVED-009] R2 bucket migration (ISSUE-002)
Fixed: 2026-06-14 — migrated all MoT+++ images from the personal
walther.website R2 bucket (`site-general`, pub-1a24c863e9654cf59be6136420ba1770.r2.dev)
to the dedicated `mot-assets` bucket on the MoT+++ Cloudflare account
(pub-136b7c559e56403eb674c24e717611c6.r2.dev).

- Audited 2,686 unique referenced object keys across 335 Sanity docs (249
  events, 83 artists, 3 afarmHosts), the three legacy JSON data files, and 13
  app/lib code files (2,371 + 4,329 + 203 URL instances respectively).
- Copied 2,371 objects that exist in the old bucket to `mot-assets`,
  preserving keys (`scripts/r2-migration-copy.mjs`); verified 10 sample paths
  return 200 on the new public URL.
- 315 referenced keys were already missing from the old bucket
  (pre-existing broken links, mostly from the `events-data.json` archive,
  e.g. `s-1-edited.png` vs the actual `.jpg`) — hostname swapped for
  consistency but still 404, unchanged by this migration
  (`scripts/r2-migration-missing.json`).
- Patched all 335 Sanity docs (`legacyImageUrls`/`imageUrls`) via
  `scripts/r2-migration-sanity-update.mjs`, batches of 20, each batch
  verified.
- Updated `events-data.json`, `artists-data.json`, `studios-data.json`, and
  hardcoded URLs in `app/`/`lib/` (incl. `lib/demoLocations.ts` museum-map
  fallback data) to the new host.
- `.env.local` now has `R2_*` vars for `mot-assets`; `CLAUDE.md` and
  `ARCHITECTURE.md` updated to reference the new bucket, personal-bucket
  references removed.
- Deployed (285fa43) and verified: build output for `/trash/`,
  `/profiles/cam-xanh/`, and `/afarm/` all contain 0 references to the old
  host and the expected count of new-host URLs. `/afarm/` was still serving
  a **stale edge-cached copy** live (ISSUE-011 cache-purge gap — no
  `CLOUDFLARE_CACHE_PURGE_TOKEN` set) at verification time; it will
  self-correct once Cloudflare revalidates, or can be fixed immediately via
  a manual cache purge for `/afarm/` in the Cloudflare dashboard.
- Follow-up (131cd6e): `r2-migration-copy.mjs` and `r2-migration-list-old.mjs`
  briefly committed hardcoded R2 credentials for both buckets (285fa43) —
  switched to env vars. **Both R2 API tokens (old `site-general-mot-plus` and
  new `mot-assets`) should be rotated**, since this is a public repo and the
  secrets were live in history for one commit.

### [RESOLVED-005] pug-alex-williams orphan
Fixed: 2026-06-11 — consolidated into alex-williams with 301 redirect (commit 5354c73)

### [RESOLVED-006] Luke Schneider in site data
Fixed: 2026-06-11 — purged from all site-facing sources (commit 5354c73)

### [RESOLVED-008] deathYear wired from Sanity (ISSUE-004)
Verified 2026-06-14 — fully wired, no code change required. `deathYear` and
`birthYear` are both in `ARTIST_FIELDS` (`lib/sanity.ts`); `getArtistBySlug`
returns them (no `active` filter, so deceased docs resolve);
`app/profiles/[slug]/page.tsx` renders `birthYear–deathYear` from the Sanity
fields (`deceasedDates`, lines 85–89) with no hardcoded `DECEASED_DATES` map.
Sanity values confirmed: `lan-anh-le` 1993–2020, `dinh-q-le` 1968–2024. Live
bio pages render the dates correctly (HTTP 200, italic deceased treatment).

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
