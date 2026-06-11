# MoT+++ Site Architecture

> Single source of truth for how motplusplusplus.com works.
> Audited 2026-06-11 against live Sanity data and the production site.
> **Read this in full before changing profiles, events, matching logic, Sanity schema, or routing.**

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

1. `npm run build` → static export to `out/` (fails without
   `NEXT_PUBLIC_MAPBOX_TOKEN`, kept in `.env.local`).
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
**The site repo's `sanity-schemas/` folder is a stale partial copy** (only
`inquiry.ts` and `museumLocation.ts`) — do not trust it; consider deleting it
or replacing it with a pointer file.

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

- **JSON-only events have no `artists[]` refs** (`toEventFromJson` hardcodes
  `artists: []`), so the 82 public JSON-only events depend entirely on
  name-matching for profile links (§4).
- **Client inconsistency:** event and afarmHost queries use a non-CDN client
  (`useCdn: false`), but artist queries (`getArtists`, `getArtistBySlug`)
  use the CDN client — builds can pick up stale artist data. Should be
  unified on the non-CDN `buildClient`.
- **Profiles listing vs. profile pages disagree on sources.** Detail pages
  build for `artists-data.json ∪ BIO_SLUGS ∪ Sanity`, but the listing only
  shows `Sanity ∪ artists-data.json`. A `BIO_SLUGS` entry in neither source
  gets an orphan page that exists but is unlisted. Currently exactly one:
  `pug-alex-williams`.
- **Resident-status logic is split:** the listing treats JSON `resident: true`
  as authoritative ("Sanity `isAfarmResident` is often not set") and overlays
  the hardcoded `HOSTING_SLUGS` set in `app/profiles/page.tsx` (which
  duplicates the hosting-artist list in CLAUDE.md and `studios-data.json`).
- Next.js caches Sanity responses in `.next/cache` between builds —
  `rm -rf .next && npm run build` after significant Sanity content changes.

---

## 4. Profile ↔ event linking

Two mechanisms run side by side; explicit references win, name-matching fills
the remainder.

### 4a. Explicit Sanity references (primary — nearly complete)

The `event` schema has an `artists[]` array of references to `artist` docs.
**206 of 216 active Sanity events already have refs populated**; only one
real (non-bio) Sanity event is missing them
(`the-calligraphic-regimes-…-pamela-n-corey`).

- Event page → profiles: `event.artists` (dereferenced in `EVENT_FIELDS`).
- Profile page → events: `getEventsByArtistRef(artistId)` — GROQ
  `references($artistId)`.
- Both pages merge explicit results with name-matched results, deduped by
  slug, explicit first.

### 4b. Name matching (legacy fallback — `lib/events.ts`, `lib/artists.ts`)

`matchParts(name)`: strip diacritics → lowercase → split on whitespace →
keep words ≥4 chars not in `MATCH_BLOCKLIST` → require ≥2 surviving parts
(or 1 part in `SINGLE_NAME_WHITELIST`: kaki, coco, yeonjeong). An event
matches when **all** parts appear in its title+slug (description is also
checked only when some part is ≥6 chars).

- `MATCH_BLOCKLIST` blocks generic art-world words plus very common
  Vietnamese name fragments (nguyen, tran, minh, linh, phuong, thanh, trang,
  hong, song, bert, chung, strange) — added to stop false positives.
- `BIO_SLUGS` (136 slugs in `lib/events.ts`) is the authoritative set of
  event-document slugs that are bio pages, not real events.
- `getRelatedResidents(event)` = bios whose name matches the event.
  `getRelatedEvents(bio)` / `getArtistEvents(artist)` = the inverse.

### Verified failure modes (counted 2026-06-11)

**60 of 136 BIO_SLUGS produce zero match parts** → those artists get no
name-matched event links (and contribute no related-resident links):

1. All name parts <4 chars or blocklisted — most short Vietnamese names
   (`tam-do`, `anh-vo`, `duy-nguyen`, …) and names whose distinctive word was
   blocklisted to stop false positives, which now also blocks the artist's own
   matches (`ian-strange`).
2. Exactly one part survives but isn't whitelisted (`boynton-yue` →
   [boynton], `thom-nguyen` → [thom], `karlie-ho` → [karlie]).
3. Punctuation glued to tokens makes them unmatchable
   (`exxonnubile-julia-weiner`, `pug-alex-williams`, `irene-ha`).
4. Three artists with `resident: true` in `artists-data.json` are absent from
   `BIO_SLUGS`: `do-nguyen-lap-xuan`, `alex-williams`, `duong-tu-que` —
   `getRelatedResidents` never considers them.

Additionally, 5 bio-page events have **no corresponding Sanity artist doc**:
`bert-nguyen-san`, `montez-press`, `nguyen-thuy-hang`, `lap-xuan`,
`pug-alex-williams` — so explicit-ref linking can't reach them either.

### Assessment and recommended direction

Name matching is fundamentally the wrong tool for this corpus: Vietnamese
names are short, share extremely common fragments, and appear inside ordinary
prose, forcing an arms race of blocklists/whitelists that now silently
disables linking for 44% of bios. The right model — explicit references — is
**already built and 95% populated** on the Sanity side. The endgame:

1. Migrate the 82 remaining JSON-only public events into Sanity (script
   pattern exists: `scripts/migrate-events-to-sanity.js`,
   `scripts/create-missing-sanity-events.js`) and set their `artists[]` refs.
2. Create the 5 missing `artist` docs.
3. Make refs the *only* mechanism; delete `matchParts`, `MATCH_BLOCKLIST`,
   `SINGLE_NAME_WHITELIST`, `getRelatedResidents`/`getRelatedEvents`/
   `getArtistEvents` name paths.
4. `BIO_SLUGS` can then shrink to its one remaining job (excluding bio-page
   slugs from `/events/` static generation) — or disappear if `isBioPage`
   in Sanity becomes authoritative.

Until then, do **not** "fix" the 60 zero-match bios by loosening matchParts —
every loosening reintroduces false positives. Add explicit refs instead.

---

## 5. Profile classification

A profile's displayed type comes from three overlapping signals:

- `BIO_SLUGS` membership (has a bio-page event doc),
- `HOSTING_SLUGS` (hardcoded in `app/profiles/page.tsx`: the 7 a.Farm hosts),
- `artists-data.json` flags (`resident`, `studioHost`, `curator`,
  `collective`, `performancePlus`) and Sanity `isAfarmResident` + free-text
  `role` string.

The listing filter is resident / hosting artist / other; badges on the detail
page render the JSON flags. Known gap: curators, researchers, writers etc.
display as generic artists — the `curator` flag exists in JSON but Sanity has
only the free-text `role`. A proper taxonomy (enum field on the Sanity
`artist` doc, surfaced as badges/filters) is wanted but not yet designed.

---

## 6. Known issues, root causes, and status

| # | Issue | Root cause | Status |
|---|---|---|---|
| 1 | **All inquiry forms broken in production** — `POST /submit-inquiry` returns 404 (verified live). Affects `/trash` purchase inquiries, `/afarm/apply`, `/museum/inquire`. | `functions/submit-inquiry.js` uses the Cloudflare **Pages** Functions convention (`onRequestPost`), but the site deploys as a plain **Worker** — that directory is never deployed. `worker.js` has no route for it. | **Open — highest priority.** Fix: handle `POST /submit-inquiry` inside `worker.js` (needs a Sanity write token as a Worker secret), then delete `functions/`. |
| 2 | Live site silently reverts to older code; pages disappear after deploys. | GitHub Action redeploys `origin/main` on `workflow_dispatch`; local wrangler deploys of unpushed commits get overwritten. | Documented; not mechanically enforced. Extend `npm run deploy` to refuse on dirty tree / unpushed commits. |
| 3 | 60/136 bios get zero name-matched event links; 3 flagged residents never considered. | Name-matching architecture vs. Vietnamese name corpus (§4). | Mitigated wherever Sanity refs exist; full fix = §4 endgame. |
| 4 | `sanity-schemas/` in this repo is stale (2 of 6 types). | Schemas moved to the Studio repo; copy never updated. | Delete or replace with pointer. |
| 5 | Artist queries can hit stale CDN data at build. | `getArtists`/`getArtistBySlug` use the `useCdn: true` client. | Switch to `buildClient`. |
| 6 | Pages show stale Sanity content after deploy. | `.next/cache` persists fetch responses across builds. | Workaround documented: clean build. |
| 7 | Large JS chunks intermittently 404 after deploy (museum map broke twice). | Cloudflare Workers Assets bug with files >500KB marked "already uploaded". | Mitigated: `npm run verify-deploy` runs after every deploy; if it fails, touch `components/MuseumMap.tsx`, rebuild, redeploy. |
| 8 | `/residents/` exact path is a soft meta-refresh redirect, not 301. | Static stub asset shadows the worker (asset-first routing, §1). | Cosmetic/SEO; delete `app/residents/page.tsx` to let the worker 301. |
| 9 | One orphan profile page (`pug-alex-williams`) exists but is unlisted. | Listing and detail pages use different slug-source unions (§3). | Add to Sanity or `artists-data.json`. |
| 10 | Curators/researchers displayed as artists. | No taxonomy field; flags not fully surfaced. | Needs design (§5). |
| 11 | Stale doc counts elsewhere (e.g. "244 events"). | Data has grown: `events-data.json` = 339, Sanity = 216 active. | This file is now the reference. |

---

## 7. Recommended next steps (priority order)

1. **Fix `/submit-inquiry`** — user-facing forms are silently failing right
   now. Implement in `worker.js` with a Sanity write-token Worker secret;
   remove `functions/`.
2. **Harden the deploy script** — make `npm run deploy` fail if the working
   tree is dirty or `main` isn't pushed to `origin/main`; never run raw
   `wrangler deploy` again.
3. **Finish the Sanity event migration** — the 82 JSON-only public events →
   Sanity with `artists[]` refs; create the 5 missing artist docs; ref the one
   unlinked Sanity event (pamela-n-corey talk).
4. **Delete name-matching** once (3) is done; collapse the dual-source merge
   for events; `events-data.json` becomes archive-only.
5. **Unify Sanity clients** on `useCdn: false` for all build-time queries.
6. **Profile taxonomy** — add a role enum to the Sanity `artist` schema,
   surface as badges/filters; retire the JSON flags and `HOSTING_SLUGS`
   hardcoding.
7. **Housekeeping** — delete the stale `sanity-schemas/` copy and the
   `/residents` stub; extract the shared junk-image filename list.
