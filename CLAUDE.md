# MoT+++ Next.js Site — Claude Code Reference

> **Before making any changes to profiles, events, matching logic, Sanity
> schema, or routing: read `ARCHITECTURE.md` in full.** It is the single
> source of truth for how this site works.

## Site
- **Live:** `https://motplusplusplus.com` (+ `www.`). There is **no workers.dev
  fallback**: `motplusplus-site.motplusplusplus.workers.dev` is switched off (404,
  checked 2026-11-22), and so are preview URLs on the production Worker. For a preview,
  deploy the build to a separate throwaway Worker with no routes, and delete it after review.
- **GitHub:** `https://github.com/motplusplusplus/motplusplus-site.git`
- **Framework:** Next.js static export (`out/`) → Cloudflare Worker
  (`worker.js` + assets binding)

## Deploy — HARD RULES
- **`npm run deploy` is the only command needed — never run `wrangler deploy`
  directly.** It (`scripts/deploy.js`):
  1. Loads `NEXT_PUBLIC_MAPBOX_TOKEN`, `CLOUDFLARE_API_TOKEN`, and
     `CLOUDFLARE_ACCOUNT_ID` from `.env.local` automatically.
  2. Aborts with a clear error if the working tree isn't clean or local
     `main` isn't in sync with `origin/main`.
  3. Does a clean build (`rm -rf .next out && next build`).
  4. Runs `wrangler deploy`, purges the edge cache (if a purge token is set),
     then `verify-deploy` — which FAILS if the live site isn't serving the
     just-built BUILD_ID (catches the stale-asset-manifest bug; ISSUE-011 / §9)
     — and `verify-content`, which FAILS if the live pages of the most recently
     edited artists don't match Sanity (portrait, links, bio, photo credits).
  5. Pre-warms Sanity's image CDN (`scripts/prewarm-images.mjs`, best effort, never
     fails): every `/trash` grid size of every work's first image, as AVIF and WebP, so
     the first phone visitors don't wait seconds on fresh resizes. The Action runs it too.
     Run by hand with `npm run prewarm-images`. Its widths must match `lib/workImage.ts`.
- **Commit and push to `origin/main` must precede every deploy, without
  exception** — `npm run deploy` enforces this. A GitHub Action
  (`.github/workflows/deploy.yml`) can be triggered at any time and
  redeploys whatever is on `origin/main` — any deployed-but-unpushed local
  commits would otherwise be silently reverted on the live site. This has
  happened before (pages disappeared). **The Action is ENABLED** (state `active`;
  check with `gh workflow list --all`). It was disabled 2026-06-13 while it raced
  local deploys (ISSUE-011), then re-enabled 2026-06-16 as the Sanity-publish
  auto-deploy target (see "Content auto-deploy" below). Only its `push:` trigger
  stays commented out; it runs on `workflow_dispatch` / `repository_dispatch`
  (the Sanity webhook). Do not disable it — that silently breaks Sanity → live.
- Credentials: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` /
  `NEXT_PUBLIC_MAPBOX_TOKEN` live in `.env.local` (gitignored, not stored in
  this repo). Workers account ≠ R2 account — they are different Cloudflare
  accounts; only the Workers account ID belongs in `.env.local` for deploy.
- If `verify-deploy` fails (Workers Assets large-file 404 bug): make a
  trivial change to `components/MuseumMap.tsx`, commit, push, and re-run
  `npm run deploy`.
- **Edge-cache purge is mandatory after every deploy.** The zone caches HTML at
  the edge (`cf-cache-status: HIT`) and `must-revalidate` does NOT reliably
  self-correct it: on 2026-11-17 three CI deploys shipped fresh profile pages
  that stayed invisible behind stale cached HTML. `scripts/purge-cache.js`
  (`purge_everything`) runs in `npm run deploy` (skips with a warning only if
  `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_CACHE_PURGE_TOKEN` are unset in
  `.env.local`) and in the Action (`--require`: hard failure if the
  `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_CACHE_PURGE_TOKEN` Actions secrets are
  missing). Manual purge: `npm run purge-cache`, or Cloudflare dashboard →
  motplusplusplus.com → Caching → Purge Cache. See ISSUE-011 / ARCHITECTURE.md §9.
- **`npm run verify-content`** (also run by the Action and `npm run deploy`)
  compares the live pages of the 3 most recently edited artists to Sanity and
  fails the run on any mismatch; it also checks the most recently edited event
  (title, hero, gallery images, credits). A green BUILD_ID check alone does not
  prove content is live.
- **Build resilience:** fonts are self-hosted (`public/fonts`, no Google Fonts at build
  time; Inter is trimmed to weights 300–400 and the glyphs/features the site uses, see the
  comment in `app/globals.css` before adding a weight); a failed build is retried once; a failed Action run emails info@ via the Gmail API
  (`GMAIL_*` Actions secrets, same as mot-outbox; setup in ARCHITECTURE.md §9.7).

## Content auto-deploy (Sanity → live, no manual deploy needed)
- **Sanity content changes auto-deploy** within **~3–5 minutes** of publish.
  Publishing/updating/deleting a doc in Studio fires the "Auto deploy on publish"
  webhook → GitHub Action `deploy.yml` → `next build --webpack` (Node 22) →
  `wrangler deploy`. **No manual `npm run deploy` is needed for content-only
  changes.** (Pipeline + diagram: ARCHITECTURE.md §9.6; verified 2026-06-16.)
  The Action purges the edge cache and runs `verify-content` after deploying, so
  a green run means live pages match Sanity.
- **Code changes** still need a deploy: either **`git push origin main`** (triggers
  the Cloudflare Workers Build, which now builds correctly with `--webpack`
  + token — ISSUE-013) **or** `npm run deploy` from the dev machine.
- **Do not** set `.github/workflows/deploy.yml` back below **Node 22** (wrangler
  4.100 requires it), and keep the `NEXT_PUBLIC_MAPBOX_TOKEN` Actions secret +
  the CF Workers Build dashboard command (`npm run build -- --webpack`) in place.

## Header search (typeahead dropdown)
- The header search bar shows a live typeahead dropdown (`components/HeaderSearch.tsx`)
  in addition to the existing `/search` results page (unchanged). Pressing
  Enter / the search button still navigates to `/search?q=…`.
- **Powered by a live client-side GROQ query**, not a build-time index. The
  browser fetches a compact index (~54 KB gzipped) straight from Sanity's public
  CDN API (`t5nsm79o.apicdn.sanity.io`, dataset `production` is `aclMode: public`
  — no token) the first time a user searches, caches it for the session, and
  filters client-side. **No rebuild, webhook, or extra Worker** — content edits
  appear in search within Sanity's CDN purge window (~minutes). See
  ARCHITECTURE.md §10.
- **CORS**: the public domains + `http://localhost:3000` are allowlisted in the
  Sanity project (no credentials). Adding a new public domain requires adding its
  CORS origin in Sanity (`sanity cors add <origin>` or the MCP `add_cors_origin`).
- **No new environment variables.** `lib/searchIndex.ts` hardcodes the public
  projectId/dataset/apiVersion (same public values already in `lib/sanity.ts`).
- Indexes only publicly visible content: artists (`active`), events
  (`active && !isBioPage`), a.Farm studios (`visibility == "visible"`), trash &
  museum (`active`). News/press is NOT in Sanity — it lives in `lib/press.ts`
  (shared with `/press`) and is indexed there, badged "News", linked to `/press`.
- **All result hrefs are internal** to motplusplusplus.com — enforced by
  `isInternalHref()` at filter time, not just convention.

## Key systems (details in ARCHITECTURE.md)
- **Profiles** — canonical artist pages at `/profiles/[slug]`; `/residents/*`
  and `/artists/*` are legacy namespaces 301-redirected by `worker.js`.
  Pages are built from the union of Sanity `artist` docs,
  `artists-data.json`, and `BIO_SLUGS` stubs; Sanity is primary, JSON fills
  gaps and supplies resident/host/curator flags.
- **Events** — `/events/[slug]` built from Sanity `event` docs merged with
  `events-data.json` (Sanity wins on slug collision; JSON fills events not
  yet migrated). Bio-page event docs (`BIO_SLUGS` / `isBioPage`) are excluded
  from event generation and listings.
- **Profile↔event linking** — **explicit `artists[]` reference fields on Sanity
  events only**. Legacy name-matching (`matchParts`) was deleted 2026-06-12
  (RESOLVED-004); see ARCHITECTURE.md §4. To fix a missing profile↔event link,
  add an explicit `artists[]` ref on the event in Sanity — never reintroduce
  fuzzy matching.
- **Badge taxonomy** — lives in `lib/badges.ts`; read before modifying
  profile display or filters.

## Cloudflare R2 (images)
- **Bucket:** `mot-assets` — lives in the MoT+++ Cloudflare account (same
  account as Workers).
- **Public URL:** `https://pub-136b7c559e56403eb674c24e717611c6.r2.dev`
- **Account ID:** `f2a86349fa252c2582bc0f478ccdf9ab` (same as Workers account)
- Image upload settings: max 1600px, quality 85, JPEG.
- Credentials: see `.env.local` (`R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_PUBLIC_URL`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).

## Sanity CMS
- **Project ID:** `t5nsm79o`, dataset `production`
- **Studio URL:** `https://studio.motplusplusplus.com` — bookmark this one. The
  old `https://motplusplus.sanity.studio` still works for login but is a stale
  fallback, not rebuilt since Studio moved to Cloudflare Workers hosting (see
  ARCHITECTURE.md §11, ISSUE-014).
- **Studio repo (canonical schemas):** `~/Projects/motplus-sanity` →
  `schemaTypes/` (`event`, `artist`, `afarmHost`, `museumLocation`,
  `trashItem`, `inquiry`). See ARCHITECTURE.md §8 for a field-by-field
  reference cross-checked against `lib/sanity.ts`.
- **Client config:** `lib/sanity.ts` (use the non-CDN `buildClient` for
  build-time queries).
- Write tokens: not stored here — see Claude memory / sanity.io manage.
- **Schema changes ship in two places, together with the site code that reads them:**
  the Studio build (`npm run build` + `npx wrangler deploy` in the Studio repo, see its
  CLAUDE.md), and the deployed schema record (`npx sanity schema deploy` there), which
  Sanity's MCP/AI tools validate edits against. A stale record rejects valid edits (it was
  missing `workType` and `nationalities` until 2026-11-22).

## Mapbox (+1 Museum map)
- **NEVER run `next build` directly — always use `npm run deploy`.** Running
  `next build` without `--webpack` (Turbopack default) prevents the Mapbox token
  from being inlined and causes the museum map to show a gray box silently.
  `verify-deploy` now greps the built chunks for the literal token and fails the
  deploy if it isn't inlined.
- Token in `NEXT_PUBLIC_MAPBOX_TOKEN` (`.env.local`); restricted to the
  production domains. Required for `npm run build` — the build fails without it.
- **Never** apply CSS `filter` (incl. `grayscale`) to
  `.mapboxgl-canvas-container` or any ancestor of the map container — it
  blanks the WebGL canvas in all browsers. Correct pattern:
  `filter: grayscale(1)` directly on `.mapboxgl-canvas`.

## CRITICAL: Museum Map / Mapbox Token

The museum map WILL silently break if any of these rules are violated:

1. **Always use `npm run deploy`** — never `npx wrangler deploy` or
   `wrangler deploy` directly. The deploy script loads `.env.local`, which
   bakes `NEXT_PUBLIC_MAPBOX_TOKEN` into the build at compile time. Without
   this, the token resolves to `""` and `MuseumMap.tsx` silently returns early
   (no error, no map).

2. **Always build with webpack.** Next.js 16 defaults `next build` to
   Turbopack, which does NOT inline `NEXT_PUBLIC_*` env vars the way webpack
   does. Both the `build` script (`package.json`: `next build --webpack`) and
   `scripts/deploy.js` (`npx next build --webpack`) force webpack for this
   reason — do not remove the flag.

3. **GitHub Actions secret.** `.github/workflows/deploy.yml` reads
   `NEXT_PUBLIC_MAPBOX_TOKEN` from `secrets.NEXT_PUBLIC_MAPBOX_TOKEN` and fails
   the build loudly if it's unset or malformed. The secret has been set since
   2026-08-10 and the workflow is enabled (see "Deploy — HARD RULES"). Its
   `push:` trigger is still intentionally commented out — Sanity webhook
   dispatches and Cloudflare Workers Builds already cover deploys, and a push
   trigger would double-fire.

4. **Verifying a deploy fixed the map** — after any deploy, run:
   ```
   curl -s https://motplusplusplus.com/museum/ \
     | grep -oE '/_next/static/chunks/app/museum/page-[a-f0-9]+\.js' | head -1
   ```
   then fetch that path (prefixed with `https://motplusplusplus.com`) and grep
   for `pk.eyJ` — if present, the token is inlined correctly.

5. **Map blank but the token IS inlined → it's ISSUE-011 (missing chunks), not
   the token.** The map loads via a dynamic import; `app/museum/page` does
   `Promise.all([n.e(5508), n.e(240), n.e(2657), n.e(2149), n.e(4485)])`. If any
   of those chunk files 404 (a stale/partial asset deploy), the import rejects and
   the section goes blank with a chunk-load error — looks identical to a token
   failure but isn't. Confirm by curling the museum page's referenced + dynamically
   loaded chunks (recipe in ISSUES.md ISSUE-011); a 404 there returns the 25,085-byte
   SPA page. Fix: a clean `npm run deploy` (never a bare `wrangler deploy` / content
   auto-deploy, which can ship HTML + manifest without all matching asset files).
   This recurred 2026-06-21.

Root cause history: this issue recurred multiple times (2026-05 through
2026-06) because each repair used `wrangler deploy` or bare `next build`
without `--webpack`, stripping the token again on the next deploy. A separate
recurrence (2026-06-21) was the stale-asset-manifest variant above (token fine,
chunks missing).

## Key data files
- `events-data.json` — **LEGACY ARCHIVE** (339 events). All public events now
  live in Sanity (sole source of truth). Retained only as a backup snapshot and
  to supply legacy image URLs during the slug merge. Do NOT edit manually. See
  `events-data.ARCHIVE.md`.
- `artists-data.json` — artist profiles + flags (resident/studioHost/curator)
- `studios-data.json` — A.Farm studio supplement (hostSlug, locationKeywords,
  portraitPairs, video URLs)
- `lib/events.ts` — `BIO_SLUGS`, `HIDDEN_SLUGS` (authoritative lists),
  category list + date/listing helpers (name-matching removed 2026-06-12)
- `lib/badges.ts` — badge taxonomy and `computeBadges()`; read before
  modifying profile display or filters
- Run `node scripts/export-sanity-backup.mjs` periodically to create a local
  backup of all Sanity data. Output goes to `sanity-backup/` (gitignored).

## Important rules
- Read ISSUES.md at the start of every session and flag any open items relevant to current work.
- `PLUS1_RESIDENCY_SLUGS` (in `lib/badges.ts`) should be sourced from the WP
  XML export — only add slugs confirmed in that XML
  (`/Volumes/MoT/EXPORTED DATA/wordpress/motplusplusplus.wordpress.com-2026-03-17-04_52_48/`)
- **EXCLUDED PEOPLE (2026-08, permanent)**: **Luke Schneider** and **Nguyễn
  Trà My** (aka "Tra My" / "My Nguyen") must never be created, mentioned, or
  referenced anywhere on this site or in its data — no profile page, no bio
  text, no photo, no event credit, no mention under any name variant. This
  is a deliberate policy due to a legal/trust matter, not an oversight — do
  not "fix" it by adding either person back, including while backfilling
  from the WordPress export. Mirrored in `motplus-sanity/CLAUDE.md` (the
  Studio repo, where artist docs are created).
- **No works by Luke Schneider, under any name (2026-11-18, permanent).** No work by Luke
  Schneider under any alias (including **NEW3IM**) may appear anywhere on the site: not as a
  +1 trash item, a +1 museum entry, an event credit, or a work visible in an event or profile
  image (crop or drop the image). The guard in `lib/excludedPeople.ts` blocks the name and the
  NEW3IM alias, but it cannot see images, so check every gallery by eye for events where he
  showed work (password 0~1, love in the time of cholera ch.1, Đông Chí, One World, One Word).
  internalNotes must not name him either: write "one artist withheld under the excluded-people
  policy" with a count only.
- **provenanceNotes is public (2026-11-18, permanent).** `trashItem.provenanceNotes` is in the
  public dataset. Keep it to "sold, month/year, source type" (for example `sold, 12/2018,
  certificate of authenticity and invoice`). Never put doc links, Drive ids, invoice numbers,
  buyer names or prices in it. The detailed evidence for legacy sales lives in the private
  Google Sheet "+1 trash legacy sales ledger (internal)" in info@'s Drive, shared with nobody.
  Never copy ledger contents into Sanity.
- **+1 trash work types (2026-11-18).** `trashItem.workType` (required in the Studio) feeds the
  type filter on `/trash` (`?type=painting`, shareable; combines with available/sold; a type with
  no listed works gets no button). The list and order live in `lib/trashWorkTypes.ts` and must
  match the Studio's `lib/workTypes.ts`. Any script that creates a trashItem must set `workType`.
- **+1 trash / work pages / profile works rework (2026-11-22).** Code: `app/trash/`,
  `components/work/` (viewer = PhotoSwipe v5 in `viewer.ts`, with hand-built history),
  `lib/trashWork.ts` (the one `Work` shape, exclusion guard, mailto, seeded order),
  `lib/dimensions.ts` (cm + ft/in), `lib/workImage.ts` (Sanity URL params).
  - **`trashItem.notForSale`**: a work listed on the artist's profile for the record. Never on
    `/trash`, never in trash search, never priced, never an inquire link. Visibility rule is
    `TRASH_PAGE_VISIBLE` in `lib/sanity.ts`. **Any artist can have any work listed on their
    profile on request**: create a trashItem with `notForSale: true` (workType still required).
  - **`trashItem.shownIn`** (event refs) renders as "shown in" on the work page.
  - Inquire is a `mailto:` to sales@ with subject `inquiry: <title>, <artist>` (no longer the
    `/api/inquiry` form on these pages).
  - `/trash` order is random per visitor, frozen per session; an inline script in
    `app/trash/page.tsx` applies it before first paint. Constants it shares with the client
    live in `lib/trashGrid.ts`: **never export values from a `'use client'` file for server
    use** (they arrive as client-reference stubs).
  - Header and footer links use `prefetch={false}`: viewport prefetch pulled ~800 KB on every
    phone page load (the /events payload, and the /afarm hero photo via its preload hint).
  - Warm off-white pages use `components/work/WarmPage.tsx`. On `#f6f3ee`, `#767676` text
    fails WCAG AA (4.10:1); use `var(--mot-text-quiet)` / `--mot-quiet` (#6e6a64, 4.85:1).
    Never `body:has(...)` for page styling (it cost seconds of main thread on phones).
- **RARE SEA (2026-11, permanent)**: Rare Sea (raresea.vn, an HCMC art space
  founded by the two excluded people above) must never be named, linked,
  credited or described anywhere on this site or in its data, beyond MoT+++'s
  existing public statement about the two people. Artists who have also shown
  at Rare Sea keep their normal MoT+++ profiles and credits; just never mention
  Rare Sea in their bios, captions or event text. The internal overlap list is
  kept in the profile outreach tracker (not in this repo).
- **Never pipe a count through `head` or `tail`.** Count the full set first, then
  truncate only the display, and say so when the display is truncated ("showing 20
  of 47"). Piping a query into `| tail -40` and reporting the length of what came
  back reports the truncation, not the data. This produced a real error on
  2026-08-10: a curator sweep was reported as "about ten, three actionable" when the
  full set was twelve with seven actionable, and the four missed cases were acted on
  a day late. The same rule applies to `head`, `sed -n`, `.slice()` in a reporting
  script, and any `limit` in a GROQ query used for counting — count in JS over the
  whole result set (see also the GROQ-vs-JS counting rule in the Studio repo's
  HANDOFF).
- **Photo credits** render as a small gray `photo: <photographerName>` line
  (`components/PhotoCredit.tsx`, formatter `lib/photoCredit.ts`: lowercase except
  MoT+++, a.Farm, MoTsound, MoTcyclopedia) under the portrait and each gallery
  image on profiles and events, only when `photographerName` is set. A linked
  `photographer` profile reference on event images is not rendered yet.
- Lowercase convention throughout all UI text (intentional MoT+++ voice)
- MoT+++ exact capitalization always

## A.Farm studios (afarm page slugs → studios-data.json slugs must match)
- andrew-newell-walther, le-phi-long, quoc-anh-le, hoang-nam-viet,
  karlie-ho, thom-nguyen

## External drive
- WD drive mounts at `/Volumes/MoT`
- Original event photos: `/Volumes/MoT/EXPORTED DATA/exported from google drive a.farm/`
