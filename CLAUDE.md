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
  3. Does a clean build (`rm -rf .next && next build`).
  4. Runs `wrangler deploy`, then `verify-deploy`.
- **Commit and push to `origin/main` must precede every deploy, without
  exception** — `npm run deploy` enforces this. A GitHub Action
  (`.github/workflows/deploy.yml`) can be triggered at any time and
  redeploys whatever is on `origin/main` — any deployed-but-unpushed local
  commits would otherwise be silently reverted on the live site. This has
  happened before (pages disappeared).
- Credentials: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` /
  `NEXT_PUBLIC_MAPBOX_TOKEN` live in `.env.local` (gitignored, not stored in
  this repo). Workers account ≠ R2 account — they are different Cloudflare
  accounts; only the Workers account ID belongs in `.env.local` for deploy.
- If `verify-deploy` fails (Workers Assets large-file 404 bug): make a
  trivial change to `components/MuseumMap.tsx`, commit, push, and re-run
  `npm run deploy`.

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
- **Profile↔event linking** — two mechanisms: explicit `artists[]` reference
  fields on Sanity events (primary; ~95% populated) and legacy name-matching
  (`matchParts` in `lib/events.ts`, with blocklist/whitelist). Name matching
  silently fails for 64 of 139 bios — do **not** loosen it to fix a missing
  link; add an explicit Sanity reference instead. Long-term plan: refs only.
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

## Key data files
- `events-data.json` — **LEGACY ARCHIVE** (339 events). All public events now
  live in Sanity (sole source of truth). Retained only as a backup snapshot and
  to supply legacy image URLs during the slug merge. Do NOT edit manually. See
  `events-data.ARCHIVE.md`.
- `artists-data.json` — artist profiles + flags (resident/studioHost/curator)
- `studios-data.json` — A.Farm studio supplement (hostSlug, locationKeywords,
  portraitPairs, video URLs)
- `lib/events.ts` — `BIO_SLUGS`, `HIDDEN_SLUGS` (authoritative lists) +
  name-matching logic
- `lib/badges.ts` — badge taxonomy and `computeBadges()`; read before
  modifying profile display or filters
- Run `node scripts/export-sanity-backup.mjs` periodically to create a local
  backup of all Sanity data. Output goes to `sanity-backup/` (gitignored).

## Important rules
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
