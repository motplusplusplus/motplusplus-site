# MoT+++ Next.js Site — Claude Code Reference

> **Before making any changes to profiles, events, matching logic, Sanity
> schema, or routing: read `ARCHITECTURE.md` in full.** It is the single
> source of truth for how this site works.

## Site
- **Live:** `https://motplusplusplus.com` (+ `www.`, and
  `motplusplus-site.motplusplusplus.workers.dev` as fallback)
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
     then `verify-deploy` — which now FAILS if the live site isn't serving the
     just-built BUILD_ID (catches the stale-asset-manifest bug; ISSUE-011 / §9).
- **Commit and push to `origin/main` must precede every deploy, without
  exception** — `npm run deploy` enforces this. A GitHub Action
  (`.github/workflows/deploy.yml`) can be triggered at any time and
  redeploys whatever is on `origin/main` — any deployed-but-unpushed local
  commits would otherwise be silently reverted on the live site. This has
  happened before (pages disappeared). **The Action is currently
  `disabled_manually`** (2026-06-13) — it was racing local deploys and
  re-shipping a stale asset manifest (ISSUE-011 / ARCHITECTURE.md §9), so the
  Sanity Studio deploy button is inert until the workflow is re-enabled safely.
- Credentials: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` /
  `NEXT_PUBLIC_MAPBOX_TOKEN` live in `.env.local` (gitignored, not stored in
  this repo). Workers account ≠ R2 account — they are different Cloudflare
  accounts; only the Workers account ID belongs in `.env.local` for deploy.
- If `verify-deploy` fails (Workers Assets large-file 404 bug): make a
  trivial change to `components/MuseumMap.tsx`, commit, push, and re-run
  `npm run deploy`.
- **Edge-cache purge is wired into `npm run deploy`** but is **inert until a
  token is set**: add a `Zone > Cache Purge > Purge` token as
  `CLOUDFLARE_CACHE_PURGE_TOKEN` in `.env.local` (`CLOUDFLARE_ZONE_ID` is already
  there). Until then deploy prints a skip warning; `verify-deploy` still fails
  loudly on stale HTML. To purge manually: Cloudflare dashboard →
  motplusplusplus.com → Caching → Configuration → Purge Cache. The zone uses
  `must-revalidate`, so HTML self-corrects once assets are correct. See
  ISSUE-011 / ARCHITECTURE.md §9.

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
- **Bucket:** `site-general` — lives in the *personal* Cloudflare account,
  not the Workers account. Account ID and upload token: see `.env.local`
  / Claude memory / Cloudflare dashboard (not stored here).
- **Public URL:** `https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev`
- R2 wrangler commands must target the R2 account; `wrangler deploy` targets
  the Workers account.
- Image upload settings: max 1600px, quality 85, JPEG.

## Sanity CMS
- **Project ID:** `t5nsm79o`, dataset `production`
- **Studio URL:** `https://motplusplus.sanity.studio`
- **Studio repo (canonical schemas):** `~/Documents/motplus-sanity` →
  `schemaTypes/` (`event`, `artist`, `afarmHost`, `museumLocation`,
  `trashItem`, `inquiry`). See ARCHITECTURE.md §8 for a field-by-field
  reference cross-checked against `lib/sanity.ts`.
- **Client config:** `lib/sanity.ts` (use the non-CDN `buildClient` for
  build-time queries).
- Write tokens: not stored here — see Claude memory / sanity.io manage.

## Mapbox (+1 Museum map)
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
   the build loudly if it's unset. As of 2026-06-14 this secret has NOT been
   added to the repo. Until it is, do not re-enable the push trigger in
   `deploy.yml` (currently commented out / `disabled_manually` — see
   "Deploy — HARD RULES" above). Once the secret is added, the push trigger can
   safely be re-enabled.

4. **Verifying a deploy fixed the map** — after any deploy, run:
   ```
   curl -s https://motplusplusplus.com/museum/ \
     | grep -oE '/_next/static/chunks/app/museum/page-[a-f0-9]+\.js' | head -1
   ```
   then fetch that path (prefixed with `https://motplusplusplus.com`) and grep
   for `pk.eyJ` — if present, the token is inlined correctly.

Root cause history: this issue recurred multiple times (2026-05 through
2026-06) because each repair used `wrangler deploy` or bare `next build`
without `--webpack`, stripping the token again on the next deploy.

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
- Do NOT include: Luke Schneider, Tra My, or any removed staff anywhere on the site
- Lowercase convention throughout all UI text (intentional MoT+++ voice)
- MoT+++ exact capitalization always

## A.Farm studios (afarm page slugs → studios-data.json slugs must match)
- andrew-newell-walther, le-phi-long, quoc-anh-le, hoang-nam-viet,
  karlie-ho, thom-nguyen

## External drive
- WD drive mounts at `/Volumes/MoT`
- Original event photos: `/Volumes/MoT/EXPORTED DATA/exported from google drive a.farm/`
