# MoT+++ Site Architecture

> Single source of truth for how motplusplusplus.com works.
> Audited 2026-06-11 against live Sanity data and the production site.
> Reconciled 2026-06-13 with the post-matchParts codebase (name-matching deleted, refs-only linking).
> **Read this in full before changing profiles, events, profile↔event linking, Sanity schema, or routing.**

---

## 1. System overview

| Layer | Technology | Where |
|---|---|---|
| Frontend | Next.js (App Router), **static export** (`output: "export"`, `trailingSlash: true`, unoptimized images) | `app/`, builds to `out/` |
| Hosting | Cloudflare **Worker** (`worker.js`) with an `[assets]` binding serving `out/` | `wrangler.toml`, account `f2a86349…` (see dashboard) |
| Domains | `motplusplusplus.com` + `www.` (custom domains on the Worker), plus `motplusplus-site.motplusplusplus.workers.dev` | `wrangler.toml` routes |
| CMS | Sanity, project `t5nsm79o`, dataset `production` | Studio repo: `~/Documents/motplus-sanity` (live: motplusplus.sanity.studio) |
| Images | Cloudflare R2 bucket `site-general` (separate personal account) | public URL `https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev` |
| Legacy data | `events-data.json`, `artists-data.json`, `studios-data.json` | repo root |

**Critical hosting detail — asset-first routing.** `wrangler.toml` does not set
`run_worker_first`, so Cloudflare serves a matching static asset **before**
`worker.js` ever executes. Worker code (all the 301 redirects below) only runs
for paths with **no** matching file in `out/`. Consequence: a static page at a
path "shadows" any worker redirect for that exact path. This is why
`/residents/` serves the static redirect stub (soft redirect) while
`/residents/anything-else/` gets the worker's 301.

**There is no server runtime.** Every page is HTML generated at build time.
All Sanity fetching happens during `npm run build`. Nothing on the live site
talks to Sanity at request time.

### Deploy pipeline

1. `npm run build` (= `next build --webpack`) → static export to `out/` (fails
   without `NEXT_PUBLIC_MAPBOX_TOKEN`, kept in `.env.local`). **Must use
   webpack** — Turbopack (the Next.js 16 default for `next build`) does not
   inline `NEXT_PUBLIC_*` env vars at build time; see §9.5.
2. `npm run deploy` → `predeploy` token check → `wrangler deploy` →
   `verify-deploy` (checks large JS chunks are actually served — Workers
   Assets has a known bug silently 404ing files >500KB; this broke the museum
   map twice).
3. GitHub Action `.github/workflows/deploy.yml`: **push trigger is disabled**;
   it fires on `workflow_dispatch` / `repository_dispatch` only. It checks out
   `origin/main`, validates Sanity images, builds, deploys.

**The deploy-reversion hazard:** external automation periodically fires the
workflow. If a local `wrangler deploy` shipped commits that were never pushed
to `origin/main`, the next workflow run silently reverts the live site to the
older `origin/main` state. This has happened (pages disappeared — e.g.
`/afarm/retreat` vanishing was this, not a routing bug). **Every deploy must
be preceded by commit + push to `origin/main`.** `npm run deploy` does not yet
enforce this mechanically; it should be extended to refuse when the tree is
dirty or the branch is ahead of/behind `origin/main`.

---

## 2. Route map

### Static routes (one `page.tsx` each)

```
/            /about        /advisory      /collective    /contact
/contemporary /directexperience /museum   /museum/inquire /performance
/press       /search       /sound        /trash
/events      /profiles     /studios
/afarm       /afarm/apply  /afarm/hotel   /afarm/retreat  /afarm/studios
/residents   ← stub only: server redirect() to /profiles (meta-refresh in static export)
```

### Dynamic routes and their `generateStaticParams` sources

| Route | Slug source |
|---|---|
| `/events/[slug]` | union of Sanity event slugs (`active == true`) + `events-data.json` slugs, **minus** `BIO_SLUGS` (bio entries are not built as events) |
| `/profiles/[slug]` | union of `artists-data.json` slugs + `BIO_SLUGS` stubs + Sanity artist slugs (`getArtistSlugs()` ∪ `getAllSanityArtistSlugs()`) |
| `/studios/[slug]` and `/afarm/studios/[slug]` | Sanity `afarmHost` slugs (12 docs) |

Coverage is correct: every profile/event/studio that any page links to is
generated. (Verified 2026-06-11; the past disappearance of `/afarm/retreat`
was the deploy-reversion problem above, not a `generateStaticParams` gap.)

### Redirects

**worker.js** (runs only when no static asset matches — see §1):

1. `/events/[slug]` for 94 hardcoded legacy "introducing resident X" slugs
   (`EVENT_TO_PROFILE_SLUGS`) → 301 `/profiles/[slug]/`. These are old event
   URLs still indexed by search engines.
2. `/residents/*` → 301 `/profiles/*`
3. `/artists/*` → 301 `/profiles/*`
4. Old WordPress URLs `/YYYY/MM/DD/slug` → 301 `/events/slug`

**`public/_redirects`** (processed by the assets layer): favicon rewrite, and
studio rename `saola-dalat` → `curu`.

**Naming history:** the canonical artist page namespace is `/profiles/[slug]`.
It was `/residents/`, then `/artists/`, then `/profiles/` (commit `ab9e70c`).
`app/residents/page.tsx` survives as a redirect stub; `app/artists/` and
`app/residents/[slug]/` were deleted. No internal links to the legacy paths
remain in `app/` or `components/` (verified by grep). Minor wart: because of
asset-first routing, the exact path `/residents/` is a soft (meta-refresh)
redirect, not a 301 — deleting the stub would make the worker's 301 take over.

---

## 3. Data layer

### Sources of truth

| Data | Primary | Supplement | Counts (2026-06-11) |
|---|---|---|---|
| Events | Sanity `event` | `events-data.json` fills events not yet migrated | 216 active in Sanity (57 of them bio pages); 339 in JSON; **134 JSON-only, of which 82 are real publicly-listed events** (mostly pre-2020 a.Farm / performance plus 2018–19) |
| Artists | Sanity `artist` | `artists-data.json` (133 entries) supplies artists not in Sanity **and** the flags `resident` / `studioHost` / `curator` / `collective` / `performancePlus`, which Sanity doesn't model | 219 active in Sanity |
| Studios | Sanity `afarmHost` (12 docs) | `studios-data.json` supplies fields Sanity doesn't store: `hostSlug`, `locationKeywords`, `portraitPairs`, walkthrough `videoUrl`; also used **directly** (sync, no Sanity) by the `/afarm/*` pages via the `allStudios` export | |
| Museum / Trash | Sanity only (`museumLocation`, `trashItem`) | — | |

### Where the canonical Sanity schemas live

`~/Documents/motplus-sanity/schemaTypes/` (the Studio repo) — six types:
`event`, `artist`, `afarmHost`, `museumLocation`, `trashItem`, `inquiry`.
The site repo's `sanity-schemas/` folder (a stale partial copy of two of the
six types) was deleted (2026-06-12) — see §8 for the full schema reference,
cross-referenced against `lib/sanity.ts`.

### The merge pattern (used identically in every context)

```
sanity = await getAllX()                  // Sanity wins
sanitySlugs = new Set(sanity.map(slug))
jsonOnly = jsonData.filter(e => !sanitySlugs.has(e.slug))
all = [...sanity, ...jsonOnly]            // JSON fills gaps only
```

Used in: events listing (`app/events/page.tsx`), event detail
(`app/events/[slug]/page.tsx`), profiles listing (`app/profiles/page.tsx`),
search. On slug collision Sanity always wins; the JSON entry is ignored
*except* for images (below).

### Event image assembly (`toSanityEvent` in `lib/sanity.ts`)

Per event, images = `uploadedImages` (Sanity assets) + `legacyImageUrls`
(R2 URLs stored in Sanity) + `events-data.json` images for the same slug —
junk-filtered against `JUNK_STEMS` (logos/brand files), merged across
duplicate slugs via `SLUG_ALIASES`, then deduplicated by URL **and** filename
(same photo in EN/VN R2 folders). The junk-filename list is duplicated in
three places (`lib/sanity.ts`, `app/events/[slug]/page.tsx`,
`app/profiles/[slug]/page.tsx`) — keep in sync or extract.

### Known merge weaknesses

- **JSON-only events are archived (resolved).** All 82 public JSON-only events
  were migrated into Sanity with `artists[]` refs (commit `6a0524e`).
  `toEventFromJson` still hardcodes `artists: []`, but `events-data.json` is now
  an archive / legacy-image source only, so this no longer affects linking (§4).
- **Sanity client unified (resolved).** Every build-time query uses the non-CDN
  `buildClient`; only `MuseumMap.tsx`'s runtime fetch uses the CDN
  `sanityClient` (commit `44df4f3`; §6 issue 4).
- **Profiles listing vs. profile pages disagree on sources.** Detail pages
  build for `artists-data.json ∪ BIO_SLUGS ∪ Sanity`, but the listing only
  shows `Sanity ∪ artists-data.json`. A `BIO_SLUGS` entry in neither source
  would get an orphan page that exists but is unlisted. The one instance of
  this (`pug-alex-williams`) is resolved: `lib/artists.ts` excludes it via
  `CONSOLIDATED_BIO_SLUGS`, and `worker.js` 301s `/profiles/pug-alex-williams`
  → `/profiles/alex-williams/` (its canonical profile).
- **Resident-status logic is split:** the listing treats JSON `resident: true`
  as authoritative ("Sanity `isAfarmResident` is often not set") and overlays
  the `HOSTING_SLUGS` set in `lib/badges.ts` (which duplicates the
  hosting-artist list in CLAUDE.md and `studios-data.json`).
- Next.js caches Sanity responses in `.next/cache` between builds —
  `rm -rf .next && npm run build` after significant Sanity content changes.

---

## 4. Profile ↔ event linking

Linking is now **entirely via explicit Sanity references**. The legacy
name-matching layer was **deleted** (commit `b75bc83`, 2026-06-12) once the
JSON-only event migration (§3) gave every public event a home in Sanity with
populated `artists[]` refs. `matchParts`, `MATCH_BLOCKLIST`,
`SINGLE_NAME_WHITELIST`, and `getRelatedResidents` / `getRelatedEvents` /
`getArtistEvents` no longer exist anywhere in the codebase.

### How linking works now

The `event` schema has an `artists[]` array of references to `artist` docs.

- **Event page → profiles:** `event.artists`, dereferenced in `EVENT_FIELDS`
  to `{_id, name, "slug": slug.current}`.
- **Profile page → events:** `getEventsByArtistRef(artistId)` — GROQ
  `*[_type == "event" && active == true && !isBioPage && references($artistId)]`,
  ordered by `dateISO desc`.
- **MoTSound editions** (badge input, §5): `getMotsoundPerformerEditions()`
  derives performer → edition numbers from the `artists[]` refs on
  `mot-sound-*` events.

There is no name normalization, blocklist, or whitelist in the linking path.
`stripDiacritics` survives in `lib/events.ts` but is used only for incidental
display/search normalization. `BIO_SLUGS` (`lib/events.ts`) is retained for its
one remaining job — excluding bio-page slugs from `/events/` static generation
and listings (`getListingEvents`); `CONSOLIDATED_BIO_SLUGS` (`lib/artists.ts`)
still excludes consolidated bios (e.g. `pug-alex-williams`) from standalone
profile generation.

### Why refs, not name matching

The deleted approach was fundamentally wrong for this corpus: Vietnamese names
are short, share extremely common fragments, and appear inside ordinary prose,
forcing an arms race of blocklists/whitelists that at its end silently disabled
linking for ~46% of bios while still risking false positives. Explicit
references — the model Sanity always supported — replaced it wholesale. **Any
missing profile↔event link is now fixed by adding an `artists[]` ref on the
event in the Studio, never by reintroducing fuzzy matching.**

### Remaining ref gaps

Fix in the Studio by adding an `artists[]` ref (create the artist doc first
where noted):
- `the-calligraphic-regimes-…-pamela-n-corey` — the one non-bio Sanity event
  historically missing refs, if still unset.
- `bert-nguyen-san`, `montez-press` — 2 bio-page events with no corresponding
  Sanity `artist` doc; the doc must be created before a ref can point at it.

---

## 5. Profile badge taxonomy

`lib/badges.ts` is the single source of truth for which badges and filters a
profile gets. `computeBadges(p: PersonSignals): BadgeResult` is called from
both the profiles listing (`app/profiles/page.tsx` → `ArtistsShell.tsx`) and
the bio page (`app/profiles/[slug]/page.tsx`).

**Inputs (`PersonSignals`)** — assembled per-profile from Sanity + JSON:

- `slug` — checked against the curated sets below.
- `role` — Sanity free-text `role`, falling back to `"curator"` if the JSON
  `curator` flag is set.
- `hasResidency` — `true` if Sanity `residencyStartDate` or
  `isAfarmResident` is set, or JSON `resident: true`.
- `isPerformancePlus` — JSON `performancePlus` flag.
- `motsoundEditions` — edition numbers from `getMotsoundPerformerEditions()`.

**Curated slug sets** (hardcoded — not yet Sanity fields):

- `HOSTING_SLUGS` — current a.Farm studio hosts (7).
- `COLLECTIVE_SLUGS` — MoT+++ collective members (7, matches `/collective`).
- `FOUNDER_SLUGS` — founder/director (`cam-xanh` only).
- `PLUS1_RESIDENCY_SLUGS` — pre-2018 "+1 residency" MoT+++ residents —
  currently empty; unconfirmed candidates noted in a comment.
- `PLUS1_MUSEUM_SLUGS` — artists with work placed in the decentralized "+1
  museum by any other name" collection — currently empty (no `museumLocation`
  docs with an `artistRef` yet).

**Outputs (`BadgeResult`)**:

- `primary` — single primary identity for the listing sub-label, in priority
  order: founder/director → hosting artist → curator/writer/researcher (if no
  residency) → a.Farm → +1 residency → +1 performance → "artist".
- `isFounder` — drives red founder styling on the bio hero.
- `isPlus1Museum` — whether this profile has work in the +1 museum collection.
- `filters[]` — every tag this person matches, consumed by the listing's
  filter bar (`ArtistsShell.tsx`); a profile can match several at once (e.g.
  a.Farm + +1 collective + MoTSound).
- `bioBadges[]` — ordered badges rendered on the bio-page hero; a superset of
  `filters` in places (e.g. "+1 collective" only appears here, not on the
  listing card).

**Remaining gaps:** Sanity `role` is still free-text (no enum); the curated
slug sets above are still hardcoded (relocated here from
`app/profiles/page.tsx`, not retired); `artists-data.json` flags still feed
`PersonSignals`. The "+1 residency" and "+1 museum" badges currently never
render — both curated sets are empty.

---

## 6. Known issues, root causes, and status

| # | Issue | Root cause | Status |
|---|---|---|---|
| 1 | Live site silently reverts to older code; pages disappear after deploys. | GitHub Action redeploys `origin/main` on `workflow_dispatch`; local wrangler deploys of unpushed commits get overwritten. | **Resolved.** `npm run deploy` (`scripts/deploy.js`) now refuses to run if the working tree is dirty or local `main` isn't in sync with `origin/main` (commit `cf7ab9b`). |
| 2 | Bios got zero name-matched event links. | Name-matching architecture vs. Vietnamese name corpus. | **Resolved.** Name matching deleted entirely (commit `b75bc83`, 2026-06-12); all profile↔event links now come from explicit Sanity `artists[]` refs (§4). The failure mode — fuzzy matching silently failing for short Vietnamese names — no longer exists. A missing link is now a missing ref, fixed in the Studio. |
| 3 | `sanity-schemas/` in this repo is stale (2 of 6 types). | Schemas moved to the Studio repo; copy never updated. | **Resolved.** Deleted (2026-06-12) — see `~/Documents/motplus-sanity/schemaTypes/` and §8. |
| 4 | Artist queries can hit stale CDN data at build. | `getArtists`/`getArtistBySlug` used the `useCdn: true` client. | **Resolved** (commit `44df4f3`; re-verified 2026-06-13 against `lib/sanity.ts`). Every build-time query (`getArtists`, `getArtistBySlug`, `getAllSanityArtistSlugs`, `getMuseumLocations`, events, afarmHost) uses `buildClient` (`useCdn: false`). The CDN `sanityClient` is retained for exactly one caller — `MuseumMap.tsx`'s runtime client-side fetch (the only `sanityClient` usage left in the repo). |
| 5 | Pages show stale Sanity content after deploy. | `.next/cache` persists fetch responses across builds. | Workaround documented: clean build. |
| 6 | Large JS chunks intermittently 404 after deploy (museum map broke twice). | Cloudflare Workers Assets bug with files >500KB marked "already uploaded". | Mitigated: `npm run verify-deploy` runs after every deploy; if it fails, touch `components/MuseumMap.tsx`, rebuild, redeploy. |
| 7 | `/residents/` exact path is a soft meta-refresh redirect, not 301. | Static stub asset shadows the worker (asset-first routing, §1). | Cosmetic/SEO; delete `app/residents/page.tsx` to let the worker 301. |
| 8 | One orphan profile page (`pug-alex-williams`) existed but was unlisted. | Listing and detail pages use different slug-source unions (§3). | **Resolved.** `lib/artists.ts` excludes it from standalone generation via `CONSOLIDATED_BIO_SLUGS`; `worker.js` 301s `/profiles/pug-alex-williams` → `/profiles/alex-williams/`. |
| 9 | Curators/researchers displayed as artists. | No taxonomy field; flags not fully surfaced. | **Resolved.** `roleCategory()` in `lib/badges.ts` maps Sanity `role` values (`curator`/`writer`/`researcher`) to a primary identity and filter tag (§5). |
| 10 | Stale doc counts elsewhere (e.g. "244 events"). | Data has grown: `events-data.json` = 339, Sanity = 216 active. | This file is now the reference. |

---

## 7. Recommended next steps (priority order)

### Completed (2026-06-11)

- ~~**Fix `/submit-inquiry`**~~ — **Done.** All three contact forms now
  submit via `mailto:` links instead of a POST endpoint (commit `299adc5`),
  not the `worker.js` + Sanity write-token approach originally proposed here.
  `functions/` remains unused but harmless.
- ~~**Harden the deploy script**~~ — **Done.** `scripts/deploy.js` now
  refuses to run if the working tree is dirty or local `main` isn't in sync
  with `origin/main` (commit `cf7ab9b`).
- ~~**Profile badge taxonomy**~~ — **Done.** Badges/filters now derive from
  `lib/badges.ts` and `computeBadges()` (§5), covering founder/director,
  hosting artist, a.Farm, +1 residency, +1 museum, +1 performance, +1
  collective, MoTSound, and curator/writer/researcher (commits `5354c73`,
  `babaea2`). Remaining schema/data work is tracked below.
- ~~**Orphan profile (`pug-alex-williams`)**~~ — **Resolved**, see §6 issue 8.
- ~~**Luke Schneider purged**~~ from all pages and data; he should never
  reappear (commit `5354c73`).
- ~~**`dinh-q-le` and `sao-la` profiles created**~~, including deceased
  treatment for Dinh Q. Lê (1968–2024) matching the existing Lan Anh Lê
  pattern (commits `5354c73`, `752575f`).
- ~~**Renamed the profiles listing to "MoTcyclopedia"**~~ (commit `83c8444`).
- ~~**Deleted the `/residents` stub**~~ so the worker's `/residents/*` →
  `/profiles/*` 301 fires for the exact path too (commit `b89ec98`); see §6
  issue 7.

### Completed (2026-06-12)

- ~~**Finish the Sanity event migration**~~ — **Done.** All 82 JSON-only public
  events migrated into Sanity with `artists[]` refs (commit `6a0524e`);
  `events-data.json` is now archive-only.
- ~~**Delete name-matching (the §4 endgame)**~~ — **Done.** `matchParts`,
  `MATCH_BLOCKLIST`, `SINGLE_NAME_WHITELIST`, and `getRelatedResidents` /
  `getRelatedEvents` / `getArtistEvents` removed entirely (commit `b75bc83`).
  Profile↔event linking is now refs-only (§4). The name-matching endgame is
  **complete**.
- ~~**Add a Sanity export script**~~ — **Done.** `scripts/export-sanity-backup.mjs`
  snapshots all Sanity data to `sanity-backup/` (commit `16e103d`).
- ~~**Unify Sanity clients on `useCdn: false`**~~ — **Done.** All build-time
  queries use `buildClient`; the CDN `sanityClient` remains only for
  `MuseumMap.tsx`'s runtime fetch (commit `44df4f3`; §6 issue 4).

### Remaining

1. **Populate `PLUS1_RESIDENCY_SLUGS`** (in `lib/badges.ts`) from the WP XML
   export — pre-2018 MoT+++ residents only.
2. **Populate `PLUS1_MUSEUM_SLUGS`** once Sanity `museumLocation` documents
   carry artist refs.
3. **Populate the new `deathYear` field** (added 2026-06-12) for `lan-anh-le`
   and `dinh-q-le`, query it in `lib/sanity.ts`, and replace the hardcoded
   `DECEASED_DATES` map in `app/profiles/[slug]/page.tsx`.
4. **Add a role enum to the Sanity `artist` schema** — role is still
   free-text.
5. **Retire the JSON flags** (`resident`, `curator`, `performancePlus`, etc.)
   and the curated slug sets in `lib/badges.ts` once Sanity is the sole
   source of truth for badge data.
6. **Housekeeping** — extract the shared junk-image filename list (currently
   duplicated in `app/profiles/[slug]/page.tsx`) and delete the dead
   `uploadedImageUrls` query line in `getTrashItems()` (§8). (The stale
   `sanity-schemas/` copy was deleted 2026-06-12 — see §8.)

---

## 8. Sanity schema reference

Canonical schemas live at `~/Documents/motplus-sanity/schemaTypes/`
(`event.ts`, `artist.ts`, `afarmHost.ts`, `museumLocation.ts`, `trashItem.ts`,
`inquiry.ts`, wired up in `index.ts`). This section cross-references every
field against the GROQ field lists in `lib/sanity.ts` (`ARTIST_FIELDS`,
`EVENT_FIELDS`, `AFARM_HOST_FIELDS`, and the inline lists in
`getMuseumLocations`/`getTrashItems`).

### `artist`

| Field | Type | Queried? |
|---|---|---|
| `name` | string (required) | ✓ |
| `slug` | slug | ✓ (`slug.current`) |
| `pronouns` | string | ✓ |
| `birthYear` | number | ✓ |
| `nationality` | string | ✓ |
| `originCity` | string | ✓ |
| `currentCity` | string | ✓ |
| `role` | string (free text) | ✓ |
| `isAfarmResident` | boolean | ✓ |
| `season` | string (hidden unless resident) | ✓ |
| `period` | string (hidden unless resident) | ✓ |
| `residencyStartDate` | date | ✓ |
| `bio` | text | ✓ — `coalesce(pt::text(bio), bio)` (defensive against a future portable-text migration; field is currently plain text) |
| `vnBio` | text | ✓ — same coalesce |
| `instagram` | string | ✓ |
| `links` | array of `{label,url}` | ✓ |
| `portrait` | image | ✓ (`.asset->url`) |
| `uploadedImages` | array of images | ✓ (returned as `images`) |
| `legacyImageUrls` | array of strings | ✓ |
| `active` | boolean, default true ("Listed on residents page") | filter only in `getArtists`/`getAllSanityArtistSlugs`. **`getArtistBySlug` does not filter on `active`** — a doc with `active: null`/`false` is invisible to listings and `generateStaticParams`, but still resolvable by direct slug. (`nguyen-thuy-hang` had `active: null`; fixed to `true` 2026-06-12.) |
| `deathYear` | number | ✗ not yet queried — field added 2026-06-12 (§7 item 6), not yet populated or consumed |

Computed, not schema fields (derived via `*[...references(^._id)]`):
`trashItems[]`, `museumItems[]`.

**`deathYear` field added to schema (2026-06-12)** — `artist.ts` now has a
`deathYear` number field alongside `birthYear`. `app/profiles/[slug]/page.tsx`
still hardcodes the `DECEASED_DATES` map (`lan-anh-le`, `dinh-q-le`);
populating `deathYear`/`birthYear` for those two docs, querying it in
`lib/sanity.ts`, and removing the hardcoded map remains outstanding (§7 item 6).

### `event`

| Field | Type | Queried? |
|---|---|---|
| `slug` | slug (required) | ✓ |
| `title` | string (required) | ✓ |
| `vnTitle` | string | ✓ |
| `dateISO` | date (required) | ✓ |
| `endDateISO` | date | ✓ |
| `displayDate` | string | ✓ |
| `category` | string, `options.list`: `MoT+++`, `+a.Farm`, `MoTsound`, `+1 contemporary project`, `+1 performance`, `+1 nice place for experimentation` | ✓ |
| `location` | string | ✓ |
| `description` | text | ✓ |
| `vnDescription` | text | ✓ |
| `vnAutoTranslated` | boolean | ✗ not queried |
| `uploadedImages` | array of images, each with an `isPoster` boolean | ✓ as `.asset->url` only — **`isPoster` is never queried**, so there's no way to pin a specific image as the cover/thumbnail; `images[0]` after merge always wins |
| `legacyImageUrls` | array of strings | ✓ |
| `videoUrl` | url | ✓ |
| `bandcampAlbumId` | string | ✓ |
| `wpLink` | url | ✓ |
| `artists` | array of references to `artist` | ✓ — dereferenced to `{_id, name, "slug": slug.current}` |
| `active` | boolean, default true | filter only |
| `isBioPage` | boolean, default false | ✓ |

**Category taxonomy reconciled (2026-06-12)**: the Sanity `category` field's
`options.list` now matches the `categories` export in `lib/events.ts` exactly
(`+a.Farm`, `+1 contemporary project`, `+1 performance`, `+1 nice place for
experimentation`, `MoTsound`, `MoT+++`). Previously the list had `MoTSound`
(capital S, 0 docs), `Performance` (3 `isBioPage:true` docs), and
`Collaborative` (0 docs), and was missing the three `+1 …` values used by 72
of 216 active event docs. Fix: removed `MoTSound`/`Collaborative` from
`options.list`, added the three `+1 …` values, and retagged the 3
`category:"Performance"` bio-page docs (`ngo-thanh-bac`, `lap-xuan`,
`enkhbold-togmidshiirev` — all performance plus 2018–2019 program artists) to
`+1 performance`. `toSanityEvent`/`toEventFromJson` still normalize
`'+a.farm'` → `'+a.Farm'` for the ~103 docs using lowercase `+a.farm`; left
as-is since runtime normalization already handles it and bulk-editing those
docs' raw values is a separate low-priority cleanup.

### `afarmHost`

All fields are queried via `AFARM_HOST_FIELDS` — full 1:1 match, grouped in
the schema as `identity`, `profile_en`, `profile_vi`, `practical`, `images`,
`settings`:

- identity: `name`, `slug`, `studioName`, `neighbourhood`, `mapLat`, `mapLng`
- profile_en: `practiceBio`, `welcomeBio`, `collaboration`, `languages`,
  `availability`, `environment`, `transport`, `amenities`,
  `livingArrangement`, `residentRoom`, `smoking`, `smokingDetail`, `guests`,
  `guestsDetail`, `rules`
- profile_vi: `*Vi` mirrors of the above (except the `smoking`/`guests`
  booleans, which aren't localized)
- practical: `floor`, `ac`, `bathrooms`, `privateBathroom`, `kitchenAccess`,
  `internet`, `petsInResidence`, `laundry`
- images: `portrait`, `images` (returned as `uploadedImageUrls`), `imageUrls`
- settings: `visibility` (required, `visible`/`historical`/`hidden`),
  `hostType`

No unused fields, no missing-but-expected fields.

### `museumLocation`

| Field | Type | Queried? |
|---|---|---|
| `active` | boolean, default true | filter only |
| `locationEnd` | date | filter only (`!defined(locationEnd) \|\| locationEnd >= today`) |
| `isPast` | boolean, default false | ✓ |
| `title` | string (required) | ✓ |
| `titleVi` | string | ✗ not queried |
| `artistRef` | reference to `artist`, `options.filter: active==true` | ✓ (returned as `artistSlug`) |
| `artist` | string (required, display name) | ✓ |
| `medium` | string | ✓ |
| `year` | number | ✓ |
| `description` | text | ✓ |
| `descriptionVi` | text | ✗ not queried |
| `mainImage` | image (required) | ✓ |
| `images` | array of images | ✓ |
| `location` | geopoint (required) | ✓ (returned as `coordinates`) |
| `hostName` | string | ✓ |
| `neighbourhood` | string | ✗ not queried directly here — only reached via `trashItem.museumLocationRef->neighbourhood` in `getTrashItems` |
| `accessType` | enum (required) | ✓ |
| `accessDetails` | string | ✓ |
| `hours` | string | ✓ |
| `contactMethod` | string | ✓ |
| `hostEmail` | string | ✗ not queried — internal contact field, presumably for a future inquiry-routing flow |

`titleVi`/`descriptionVi` exist for Vietnamese localization but the museum
map UI never reads them — the same EN/VN gap that events closed (`vnTitle`/
`vnDescription` **are** queried for events).

### `trashItem`

| Field | Type | Queried? |
|---|---|---|
| `active` | boolean, default false (validation requires image + price to publish) | filter only |
| `sold` | boolean | ✓ |
| `artistRef` | reference to `artist` | ✓ (returned as `artistSlug`) |
| `artist` | string (required) | ✓ |
| `title` | string | ✓ |
| `medium` | string | ✓ |
| `year` | number | ✓ |
| `dimensions` | string | ✓ |
| `edition` | string | ✓ |
| `description` | text | ✓ |
| `images` | array of images | ✓ (returned as `directImageUrls`) |
| `legacyImageUrls` | array of strings | ✓ |
| `museumLocationRef` | reference to `museumLocation` | ✓ (returned as `museumLocationId`, plus dereferenced `neighbourhood`) |
| `workLocation` | string | ✓ |
| `accessContact` | string | ✓ |
| `accessNotes` | text | ✓ |
| `consignmentStart` / `consignmentEnd` / `consignmentNotes` | date / date / text (internal) | `consignmentEnd` used in filter only; the other two intentionally not queried (admin-only) |
| `soldTo` / `soldPrice` / `soldDate` / `provenanceNotes` | strings/text (internal) | not queried (admin-only, by design) |
| `price` | string | ✓ |
| `sortOrder` | number | used in `order()` only, not returned |

**Schema gap (harmless dead query)**: `getTrashItems()` queries
`uploadedImages[].asset->url` as `uploadedImageUrls`, but `trashItem` has
**no `uploadedImages` field** — only `images` (queried separately as
`directImageUrls`). `uploadedImageUrls` is therefore always empty;
`app/trash/page.tsx` merges `uploadedImageUrls`, `directImageUrls`, and
`legacyImageUrls` into one `images` array, so the real image source (`images`)
still renders correctly. Low priority — delete the dead `uploadedImageUrls`
line whenever `lib/sanity.ts` is next touched.

### `inquiry`

Defines `type` (`trash`/`residency`/`museum`), `status`, `submittedAt`,
`name`, `email`, `message`, plus type-conditional fields — but **`lib/sanity.ts`
has no read or write for `inquiry` at all**. All three contact surfaces
(`/trash`, `/afarm/apply`, `/museum/inquire`) submit via `mailto:` links (§7
"Completed", commit `299adc5`). The schema exists for a possible future
Studio-side inquiry inbox but is currently dead on the content side — not a
bug, just unused.

---

## 9. Deploy pipeline — known issues and mitigations

The deploy path is **asset-first** (§1): a matching static asset in the deployed
worker version is served *before* `worker.js` runs. That makes two failure modes
possible where the **worker code looks updated (redirects work) but pages are
stale**, because pages come from the asset layer, not the worker. Both bit
production hard (the live site served an April 2026 build for ~2 months — see
ISSUE-011). What follows is the durable understanding and the guardrails now in
place.

### 9.1 Stale static-asset manifest (the severe one)

**Symptom:** `worker.js` redirects reflect the latest code, but every static
page serves an old build. **Tell-tale check:** a build-id-specific asset URL —
which *cannot* be an edge-cache artifact because the URL is unique per build —
404s on the live site:

```
curl -s -o /dev/null -w "%{http_code}" \
  "https://motplusplusplus.com/_next/static/$(cat .next/BUILD_ID)/_buildManifest.js"
# 200 = new assets are live; 404 = deployed version is serving an OLD asset manifest
```

**Root causes seen:**
- **Outdated wrangler.** wrangler `4.68.0`'s `wrangler deploy` reported success
  but did not advance the deployed version's asset manifest to the new build
  ("Uploaded N files … Total Upload: 3.37 KiB" with the new build 404ing live).
  Upgrading to `4.100.0` fixed it. **Keep wrangler current.**
- **The GitHub Action race (asset-layer twin of the §1 reversion hazard).** The
  "Deploy site" workflow (`.github/workflows/deploy.yml`) is triggered by the
  Sanity Studio deploy button (`workflow_dispatch`) and `repository_dispatch`.
  It can fire seconds after a local deploy and re-deploy `origin/main`,
  clobbering a good local deploy with a stale asset set. **It is currently
  `disabled_manually`** (`gh workflow disable "Deploy site"`). Re-enable only
  after making it safe; while disabled, the Studio deploy button does nothing.

**Note on "Total Upload: 3.37 KiB".** This is *normal* and not the bug:
Workers Assets is content-addressed, so files whose content is unchanged across
builds (e.g. `_buildManifest.js` when chunks didn't change) are "already
uploaded" even though their build-id *path* is new. What matters is whether the
version's **path manifest** resolves the new paths — verify by fetching the new
build-id asset (above), not by reading the upload byte count.

### 9.2 Zone "Cache Everything" rule (the masking one)

A zone Cache rule caches HTML: responses show `cf-cache-status: HIT` even with a
random `?cb=` query (cache key ignores query string), and `cache-control` is
rewritten from the worker's `private, no-store` to `public, max-age=0,
must-revalidate`. Because of `must-revalidate` the edge revalidates each request
against origin, so HTML self-corrects once the asset layer is right — which is
why "Purge Everything" appeared not to help during the incident (it was fighting
§9.1, which a purge cannot fix). The rule is a latent risk; it could be narrowed
to exclude `text/html`, but `must-revalidate` currently keeps HTML fresh.

### 9.3 Guardrails now in place

- **`scripts/verify-deploy.js` (rewritten 2026-06-13)** fails loudly if the live
  site is not serving the just-built `BUILD_ID`: it fetches
  `/_next/static/<BUILD_ID>/_buildManifest.js` (must be 200) and checks the live
  homepage HTML embeds the `BUILD_ID`, *before* the original >500 KB chunk
  checks. The old version only checked large chunks and gave false confidence
  for months.
- **`scripts/deploy.js`** now cleans `out/` as well as `.next/`, and after
  `wrangler deploy` purges the edge cache (`purge_everything`) when
  `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_CACHE_PURGE_TOKEN` are set in `.env.local`,
  then runs `verify-deploy`.

### 9.4 Cache-purge token setup (one manual step, optional)

The Workers deploy token (`CLOUDFLARE_API_TOKEN`) cannot purge cache or read the
cache ruleset (API auth error 10000). To enable automatic post-deploy purging:

1. Cloudflare dashboard → My Profile → API Tokens → Create Token → permission
   **Zone › Cache Purge › Purge**, scoped to `motplusplusplus.com`.
2. Paste it into `.env.local` as `CLOUDFLARE_CACHE_PURGE_TOKEN=` (the
   `CLOUDFLARE_ZONE_ID=4ddf948a61d4b4884144efee58d821b0` line is already there).

Until then `npm run deploy` prints a skip warning and relies on the HTML
`must-revalidate` behavior (§9.2) plus `verify-deploy` catching any stale HTML.

### 9.5 Mapbox token must be inlined at build time (webpack, not Turbopack)

`NEXT_PUBLIC_MAPBOX_TOKEN` is a **build-time** secret: Next.js inlines
`NEXT_PUBLIC_*` env vars into the client JS bundle when `next build` runs, so
`MuseumMap.tsx` (and the `+1 Museum` map it renders) reads it from
`process.env.NEXT_PUBLIC_MAPBOX_TOKEN` baked into the static export — there is
no runtime injection on this static-export site (§1).

- **Turbopack does not do this inlining.** Next.js 16 makes Turbopack the
  default `next build` engine, but it does not substitute `NEXT_PUBLIC_*`
  references the way webpack does. A Turbopack build ships `""` for the
  token, and `MuseumMap.tsx` silently returns early — no error, just a blank
  map.
- **Mitigation:** both `package.json`'s `build` script (`next build --webpack`)
  and `scripts/deploy.js` (`npx next build --webpack`) force the webpack
  compiler. Do not remove `--webpack` from either.
- **Token source:**
  - Local builds/deploys: `.env.local` (gitignored), loaded by
    `scripts/deploy.js` via `@next/env`.
  - CI (`deploy.yml`): `secrets.NEXT_PUBLIC_MAPBOX_TOKEN` — the workflow's
    build step fails loudly if this secret is unset. As of 2026-06-14 it has
    not been added to the repo's Actions secrets (the push trigger is also
    disabled — see §9.3).
- **Verifying the token is live:** fetch the museum page's JS chunk
  (`/_next/static/chunks/app/museum/page-<hash>.js`) and grep for `pk.eyJ` —
  its presence confirms the token was inlined correctly.
