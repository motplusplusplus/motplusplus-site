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
`chicko`, `annie-thao-phan`, `ho-tuong-danh`, `duy-bao`, `fad-plastic`.

**2026-06-16 bio research results (10 written, 13 still empty):**

Bios written and published to Sanity: `carl-stone` (pioneer of live computer music,
CalArts, Tokyo/Chukyo), `ken-ueno` (composer/vocalist, UC Berkeley, Rome + Berlin
prizes), `ayano-otani` (Japanese artist based in HCMC, studied medicine/piano/
psychology/design), `espen-iden` (b.1989 Bergen, interdisciplinary artist + DJ alias
Pyramiden, Saigon), `lys-bui` (illustrator/printmaker, NY/Saigon, SVA MFA 2016,
Murakami studio), `sto-len` (Asian-American artist, Queens NY, Vietnamese roots,
co-founded Cinders Gallery 2004), `tran-van-thao` (abstract painter, Group of 10,
HCMC Fine Arts 1986), `ngo-dinh-bao-chau` (b.1986, lacquer→multimedia, HCMC Fine
Arts, Galerie Quynh), `nguyen-van-du` (oil painter, HCMC Fine Arts, The Factory,
explores nationalism/violence), `thy-tran` (b.1988 HCMC, Vietnamese-Australian,
BFA Monash, photographer, LGBTQIA+ focus).

Still empty — no reliable source found: `sonar-lee`, `nguyen-giao-xuan`, `kin`,
`anh-tran`, `hien-tran`, `mai-thi-tran`, `llama-olo`, `lu-nguyen`,
`chicko`, `annie-thao-phan`, `ho-tuong-danh`, `duy-bao`, `fad-plastic`.

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

## Resolved

### [ISSUE-015] Overnight site health check — 41 broken links, 1 broken image, 2 sitemap gaps, lint cleanup, profile SEO, search index consistency
**Reported:** 2026-06-24
**Status:** RESOLVED 2026-06-24

Autonomous health-check pass: typecheck/lint baseline, a live crawl of every
landing page + a 50-page sample of profile/event detail pages (links and
images), and a sitemap audit.

**Sitemap gap (commit `109ec28`):** `app/sitemap.ts` built its profile list
from `allArtists` (`artists-data.json` + bio-page stubs only), not the same
Sanity-aware union `generateStaticParams` actually uses for
`app/profiles/[slug]`. 109 Sanity-only artists (no JSON entry, no bio-page
stub) had real, live pages completely absent from the sitemap. Fixed to use
the same union. Sitemap profile count: 152 → 243.

**5 broken internal links (commit `06ea657`), found via crawl:**
- `app/contemporary/page.tsx` had 4 hardcoded event slugs that didn't match
  their real Sanity slugs (renamed/restructured during the events migration,
  or truncated) — all 4 corrected, verified against real Sanity docs first.
- `/profiles/baby-reni` 404'd — the profiles listing page builds its artist
  list independently of `lib/artists.ts`'s `allArtists`, so it never applied
  the `CONSOLIDATED_BIO_SLUGS` exclusion, rendering a second, broken-linking
  card for an identity already correctly listed under its canonical slug
  (`irene-ha`). Fixed the listing's filter, and added the missing
  `baby-reni` → `irene-ha` redirect to `worker.js` (the other 3 consolidated
  slugs already had one — this one was always missing).

**1 broken image, same root cause as ISSUE-012 (R2 fixed directly, no code
change):** `events-data.json` (legacy archive) references
`cam-xanh-mot-doi-gai-999-9-clouds.jpeg` for `mot-doi-gai-a-beach-life-cam-xanh`,
but the migrated file in `mot-assets` is `...999-9-clouds.jpg` (no "e").
Copied the existing object to the missing key name, same bucket
(`scripts/r2-fix-mot-doi-gai-999-clouds.mjs`). This wasn't in ISSUE-012's
original 315-key audit — likely missed because it's a same-bucket extension
mismatch, not a cross-bucket missing-key case.

**Lint cleanup (commit `6428426`):** `StudioCarousel.tsx` had a real "used
before declared" error (not a runtime bug, but worth fixing) plus an unused
import; `lib/studios.ts` had a redundant `as any[]` cast.

**SEO (commit `d0cd2b1`):** added a schema.org `Person` JSON-LD block to
every profile page (name, alternateName, image, url, jobTitle, memberOf
MoT+++), alternate names folded into the meta description, a keywords meta
tag, and dropped an em dash from the description per site style rules.

Crawled: 19 landing pages (all 200), 331 links discovered from them, plus a
deeper 50-page sample (25 profiles + 25 events) checking 277 images and 177
links from each. Final re-check after fixes: 0 broken links, 0 broken images
in the same sample set.

**Round 2 (same overnight session):** afarm studio + trash item pages, and
museum/sound/performance landing pages sampled (191 + 33 images, 17 + 89
links) — all clean. Alt-text coverage spot-checked across 15 random sitemap
pages (117 `<img>` tags, 0 missing) — clean, no action needed.

**Sitemap gap #2 (commit `afc956e`):** neither `/trash` nor any of its 30
work pages were in the sitemap at all. Worse, `/trash/[slug]` pages are only
linked from the grid via a client-side lightbox (no real `<a href>` in the
static HTML — confirmed by crawling the live grid and finding zero outbound
item links) — the sitemap was their only possible discovery path for search
engines. Added `/trash` plus a `trashPages` block using the same
`getAllTrashItemSlugs()` source `generateStaticParams` uses. Sitemap count:
414 → 445.

**Round 3 (commit `ebccd32`):** the header search typeahead's trash query
(`lib/searchIndex.ts`) didn't apply the price-required-unless-sold rule
established earlier this session (`TRASH_ITEM_PRICED` in `lib/sanity.ts`) —
a priceless, unsold work (e.g. "Song 4") could surface in search results.
Not a broken link (trash results link to the general `/trash` listing, not
a per-item route) but a misleading one: searchable, yet absent from the
listing it points to. Fixed by duplicating the same GROQ condition (can't
import the canonical constant — `lib/sanity.ts` instantiates a Sanity client
at module scope, which would pull the whole SDK into this client bundle).
Verified directly against Sanity's public CDN endpoint with the exact fixed
query.

**Logged, not fixed (no current real-world impact, needs a UX judgment
call):** `components/MuseumMap.tsx`'s "inquire through +1 trash" link
(`/trash?item=<trashItem _id>`) assumes the linked trashItem is currently
visible on `/trash`. If a museum-placed work ever became priceless/unsold-
without-a-price (hidden per the price-required rule), clicking that link
would silently do nothing (the `?item=` param wouldn't match any item in
the now-filtered list) rather than erroring -- confirmed via Sanity query
that zero trashItems are currently in this state, so this is a theoretical
edge case, not an active bug. Left untouched given the museum map's history
of fragility (see the Mapbox/chunk-loading notes elsewhere in this file) --
revisit if a museum-placed work's price is ever unset.

**Round 4 — the biggest finding this session (commit `c87a95c`):** asked to
specifically hunt for the systemic pattern behind the profiles-listing and
sitemap bugs above (a page building its own artist/event list independently
of the canonical, already-filtered helpers). Found a third, more severe
instance: `app/search/page.tsx` imported `events-data.json` directly with
**no filtering at all** and linked every entry as `/events/[slug]`. 36 of
those slugs are bio-page-stub events (`BIO_SLUGS`) that
`generateStaticParams` explicitly excludes -- confirmed live, 404, including
prominent figures: `/events/cam-xanh` and `/events/aliansyah-caniago` (both
MoT+++ co-founders), plus `pamela-n-corey`, `tuyp-tran`, `regis-golay`,
`le-hien-minh`, and 30 others. The artist list had the same missing
`CONSOLIDATED_BIO_SLUGS` exclusion as the profiles-listing bug.

Fix: `events-data.json` is a fully-migrated legacy archive (RESOLVED-003,
no unique coverage left), so switched `/search`'s event list to
`getAllEvents()` (Sanity, `active == true`) with the exact same exclusion
filter `app/sitemap.ts`'s `eventPages` already uses. Verified in the build
output: `aliansyah-caniago` and `boynton-yue` now appear exactly once each
(as artist results, not duplicated as a second, 404ing event result), while
their real, distinct events (`artist-in-residence-aliansyah-caniago`,
`boynton-yue-closing-studio`) remain correctly present.

Swept every other file matching the same pattern (`grep` for direct
`artistsFromData`/`events-data.json` imports outside `lib/`):
`app/events/page.tsx` already uses the canonical `getListingEvents()` helper
correctly -- no bug there, the grep match was just a comment.

**Round 5 (no code changes -- everything checked out healthy):**
afarm/studios pages, the museum map's client-side Sanity query, and
`app/performance/page.tsx` (a third file with hardcoded lists, found via a
final exhaustive sweep) were all checked against live data and found
correct -- all 14 hardcoded event slugs and a sample of 5 performer profile
links returned 200, zero `CONSOLIDATED_BIO_SLUGS` overlap. Bundle size
reviewed: the only large chunks are the already-known, already-monitored
Mapbox GL bundle and the Vietnamese PDF font from earlier this session --
nothing new.

**Round 6 (commit `322bae7`):** verified the museum map's Mapbox token,
static fallback image, and dynamically-loaded chunks are all genuinely
working live (the static-image 403 on a bare curl was just a missing
browser-sent `Referer` header -- confirmed 200 with it set, matching a
prior session's note that this token is referer-restricted). Checked every
mailto/inquiry link construction site and found 4 occurrences of an em dash
in genuinely user-visible text (the subject line a person sees in their
email client after clicking an inquiry link) -- same style rule applied
earlier this session to meta descriptions and page copy. Fixed: the
per-item and general +1 trash inquiry subjects, the shared
`MailtoContactForm` component (currently used by `/links`), and the museum
space-inquiry subject.

A broader grep found em dashes in 34 files total -- deliberately stopped
without mass-editing further, since most look like legitimate typographic
uses (date ranges, credit lines) rather than style violations, and a
sweeping site-wide rewrite wasn't requested. **Flagging as an open question
for the project owner:** is the no-em-dash rule meant to apply site-wide to
all existing copy, or was it scoped to the specific pieces of text raised
explicitly this session? If the former, a full audit + rewrite is a
larger, separate task worth doing deliberately rather than as an overnight
side effect.

Checked 64 external links (artist personal websites, etc.) across a
40-profile sample -- all healthy, 0 dead links.

**Round 7, final (commit `0d5003b`):** full regression re-check of every
fix from all 6 prior rounds -- all still live and correct. Checked
`/afarm/apply` specifically and found `studioOptions` (the form's studio-
preference dropdown) had no filter at all on `lib/studios.ts`'s `studios`
export, which is an unfiltered 1:1 map of `studios-data.json`. Two retired/
non-current hosts -- `amanaki-hotel` and `mark-vu-studio` (a Hanoi-based
entry, inconsistent with this being a Saigon program) -- were selectable as
a "studio preference" on a live application form. Fixed with the same
`active && !hidden` filter already used consistently everywhere else this
codebase touches studio data. Couldn't verify via crawling (the dropdown is
entirely client-rendered, `useSearchParams()` requires a Suspense boundary
so the static export's initial HTML only shows a fallback) -- verified the
filter predicate directly against the raw JSON instead, confirming it
excludes exactly these 2 entries and no others.

**Session wrap-up:** 7 rounds, ~6 hours, 14 commits. Fixed: 2 sitemap gaps
(109 missing profiles, 30 missing trash pages + the /trash listing itself),
41 broken internal links (5 + 36 via /search), 1 broken image, 2 lint
errors, profile SEO (structured data + richer meta tags for all ~250
profiles), a search-index consistency gap, 4 user-visible em dashes in
mailto subjects, and 1 live-form data-integrity bug (retired studios
selectable on the apply form). Confirmed healthy and left untouched:
alt-text coverage, robots.txt, the Mapbox/museum-map pipeline, external
links, bundle size, and `app/events/page.tsx` / `app/performance/page.tsx`
(both already use canonical helpers or were independently verified clean).
Logged as open questions rather than guessed at: a theoretical museum-map
edge case with zero current impact, and whether the no-em-dash style rule
should extend to the ~34 files with pre-existing em dashes found in a
broader sweep (deliberately not mass-edited).

**Follow-up, post-session (commit `70108f7`):** project owner asked to
double-check the 109 newly-surfaced profiles for duplicates/pseudonyms
before treating them as 109 new people. Correction: only 91 of the 109 are
actually active, live profiles -- the other 18 are `active: false` Sanity
docs (the sitemap fix correctly excludes them via `getAllSanityArtistSlugs()`'s
`active == true` filter; they never had real pages). Of those 18 inactive
docs, most are already-resolved legacy duplicates or unrelated retired
entries -- audited each by bio content (not just name similarity, since
Vietnamese names share short syllables too often to trust fuzzy-matching
alone) and found 2 NEW confirmed duplicates that weren't previously
cross-referenced:
- `vicente-arresse` (inactive) = `vicente-arrese` (active) -- both bios
  independently describe the same Leipzig residency / Chile / "Ecologies of
  Water" program.
- `tran-luong` (inactive) = `tram-luong` (active) -- the inactive doc's
  corrupted bio contains the exact verbatim phrase "tram luong is a trained
  filmmaker and visual anthropologist," matching the clean bio word-for-word.

Both consolidated: `alternateNames` added to the canonical doc (published,
verified live) + a `worker.js` 301 redirect, matching the exact established
pattern from `scobi-wan`/`writher`/`dan-nguyen-demonslayer`/`baby-reni`.

**Flagged but NOT merged (insufficient evidence):** `karen-thao` (inactive)
vs `karen-thao-nguyen-la` (active) -- strong name similarity but the
inactive doc's bio is corrupted junk with no usable biographical content to
confirm against. Needs a human decision, not a guess.

**False alarm, logged separately:** `dat-nguyen` (inactive) is NOT a
duplicate of `dan-nguyen` (active, music producer) -- different real
people. `dat-nguyen`'s bio is corrupted with leaked event-announcement text
(same pattern as ISSUE-008/009), independently naming "Dat Nguyen" as a
real performer at a 2023 event. Candidate for the existing bio-cleanup
queue (ISSUE-009), not a merge.

### [ISSUE-014] Sanity Studio at the new Workers URL showed "This Studio is not registered"
**Reported:** 2026-06-20
**Status:** RESOLVED 2026-06-20

A prior session switched the Studio repo's deploy mechanism from `sanity deploy`
to `wrangler deploy` (Cloudflare Workers hosting). Unlike `sanity deploy`,
`wrangler deploy` only publishes static assets — it never registers the
resulting hostname as an authorized Sanity CORS origin. Every API request from
the new Studio URL was correctly rejected, surfaced to users as "This Studio is
not registered and cannot access your content yet."

**Fix:** `npx sanity cors add <url> --credentials` for both the long Workers
URL and the new custom domain (see ARCHITECTURE.md §11). Confirmed via
`sanity cors list`. The old Sanity-hosted Studio (`motplusplus.sanity.studio`)
was unaffected throughout — its origin was already registered and remains so —
but it has not been rebuilt since the switch to `wrangler deploy`, so it lacks
newer schema fields/Studio tools. Treat it as a stale fallback only.

**Also added in this session:** `studio.motplusplusplus.com` as a Cloudflare
Custom Domain on the same Worker, now the canonical documented Studio URL
(wrangler.jsonc commit `f079cd5`). Adding the `routes` entry initially disabled
the `workers.dev` URL as an undocumented wrangler default — fixed by setting
`workers_dev: true` explicitly; both URLs now resolve.

**Does this recur?** Registering a *specific* hostname is one-time — CORS
origins persist independently of future redeploys to the same URL. It would
only need repeating if Studio is ever deployed to a genuinely new hostname.
The in-Studio "Deploy" button (`DeployTool.tsx`) is unrelated to this risk —
it redeploys the main website's content build, not the Studio app itself, and
was never part of the failure.

### [ISSUE-013] Cloudflare Workers Build auto-deploys on push with wrong build command
**Reported:** 2026-06-15
**Updated:** 2026-06-16
**Priority:** ~~high~~ → resolved
**Status:** RESOLVED 2026-06-16 — both deploy paths confirmed producing
token-inlined webpack builds (CF Workers Build on push + GitHub Action on Sanity
publish). See "Resolution" below.

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

**Investigation 2026-06-16 (Sanity auto-deploy session):**
- A Sanity webhook "Auto deploy on publish" (production; create/update/delete)
  already exists and POSTs to the **GitHub Actions** `deploy.yml` dispatch
  endpoint — delivery logs show 204 (success), so the webhook fires fine.
- The dispatched Action runs **fail** — but the build now succeeds (the
  `NEXT_PUBLIC_MAPBOX_TOKEN` Actions secret IS present; §9.5/older notes saying
  it was unset are stale). The run dies at `wrangler deploy`:
  `Wrangler requires at least Node.js v22.0.0. You are using v20.20.2.`
  (`.github/workflows/deploy.yml` pins `node-version: '20'`; wrangler 4.100.0
  needs ≥22.) This is why Sanity publishes never reach production.
- CF Workers Build deploy hooks **cannot be created via API** (dashboard only).

**Resolution 2026-06-16 — two independent fixes, both verified:**

1. **CF Workers Build dashboard fix confirmed working.** Push of `2036f0d`
   triggered a CF Workers Build that deployed `09788eb8` (~114s after push) with
   a fresh chunk and the **Mapbox token inlined (`pk.eyJ` present)**. The
   dashboard build-command change (`npm run build -- --webpack` +
   `NEXT_PUBLIC_MAPBOX_TOKEN` env var) is effective — push-triggered auto-builds
   no longer ship a tokenless map. The old "deploy twice" workaround is no
   longer needed.

2. **GitHub Action Node 20→22 fix confirmed working** (commit `dd85564`).
   Root cause of the Action failures was `wrangler deploy` aborting with
   `Wrangler requires at least Node.js v22.0.0`. After bumping
   `.github/workflows/deploy.yml` to `node-version: '22'`, a clean
   `workflow_dispatch` run (27596388945, sha `dd85564`) went **fully green** —
   Build ✓, Deploy to Cloudflare Workers ✓, verify-deploy ✓. The
   Sanity "Auto deploy on publish" webhook → Action → `wrangler deploy`
   pipeline is now **fully operational** (content live ~3–5 min after publish).

**Known benign caveat (the two mechanisms only "race" when triggered together).**
A git *push* triggers the CF Workers Build; a Sanity *publish* triggers the
GitHub Action — different triggers, so they normally don't collide. If a push
and a publish happen within the same ~2-minute window, both build the same
`origin/main` and deploy correct token-inlined output, but with different
BUILD_IDs; whichever lands last wins, and the Action's `verify-deploy` may fail
its "homepage embeds this BUILD_ID" check (cosmetic — content is still correct).
This was observed once during testing (push `dd85564` + a manual dispatch fired
together); a publish on its own is fully green. Not worth special handling.

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
**Updated:** 2026-06-21
**Priority:** ~~critical~~ → resolved (primary); RECURRED 2026-06-21 (see below)
**Status:** RESOLVED 2026-06-13 → **RECURRED 2026-06-21** (stale/partial asset set broke the museum map) → fixed by a clean `npm run deploy`.

**Recurrence 2026-06-21 — the museum map went blank (the visible symptom of this class of bug).**
Andrew reported the `/museum` Mapbox section showing a blank box with an error.
Diagnosis ruled out the usual map suspects and proved it was THIS bug again:
- The Mapbox token was inlined in the live build (`pk.eyJ` present in the live
  `app/museum/page` chunk) AND valid (Mapbox style API returns 200 with a
  `Referer: https://motplusplusplus.com` — the URL-restriction note in Claude
  memory was stale; production is allowed). So NOT a token problem.
- The live `/museum` HTML + webpack runtime were internally inconsistent with the
  deployed asset set: of the 14 chunks in the webpack manifest, only 2 returned
  200 (the unchanged vendor chunk `2149` = mapbox-gl + MuseumMap, ~990 KB; and
  `2657`); the other **12 returned the SPA 404 page (identical 25,085 bytes)** —
  i.e. those chunk files were never uploaded.
- **Proof it broke the map specifically:** the `app/museum/page` chunk loads the
  map via `Promise.all([n.e(5508), n.e(240), n.e(2657), n.e(2149), n.e(4485)])`.
  Chunks **5508, 240, 4485 all 404'd**, so that `Promise.all` rejects, the
  `dynamic(() => import('./MuseumMap'))` fails, and the section renders blank with
  a chunk-load error. Same stale-asset-manifest mechanism as the original
  ISSUE-011 (vendor chunks whose hash didn't change survive; new app-code chunk
  hashes referenced by the manifest were never deployed).
- **Likely trigger:** a deploy path that bypassed `verify-deploy` — a content
  auto-deploy via the GitHub Action / Cloudflare Workers Build on push, or a bare
  `wrangler deploy` — shipped HTML + a webpack manifest without all the matching
  asset files. `npm run deploy` (clean `rm -rf .next out && build`, then
  `verify-deploy`) regenerates a consistent set and is the fix.

**Diagnostic recipe (reuse next time the map is blank):**
```bash
# 1. all chunks the live /museum HTML references — every one should be 200
curl -s https://motplusplusplus.com/museum/ | grep -oE '/_next/static/[^"]+\.js' | sort -u \
  | while read u; do echo "$(curl -s -o /dev/null -w '%{http_code}' https://motplusplusplus.com$u) $u"; done
# 2. the chunks the museum page DYNAMICALLY loads (the real tell): pull the page
#    chunk, read its Promise.all([n.e(ID),...]) ids, map ids->hashes via the
#    webpack-*.js runtime, and curl each. A 404 (== 25,085-byte SPA page) on any
#    of them is the bug. The token grep (`pk.eyJ`) confirms the token is a
#    separate, non-issue.
```

What looked (in the original 2026-06-13 incident) like an edge-cache problem was actually **two compounding layers**.
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

### [ISSUE-003] PLUS1_RESIDENCY_SLUGS empty
**Resolved:** 2026-06-16 — WP XML confirms the "+1 residency" badge referenced the
2019 Performance Plus cohort, who already carry "+1 performance" badges via the
`PLUS1_PERFORMANCE_SLUGS` path in `lib/badges.ts`. `PLUS1_RESIDENCY_SLUGS` is
therefore redundant and intentionally empty. No code change needed. References
removed from ARCHITECTURE.md §7 Remaining list.

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
