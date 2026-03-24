# MoT+++ Next.js Site — Claude Code Reference

## Site
- **Live:** `https://motplusplus-site.motplusplusplus.workers.dev`
- **Future domain:** `https://motplusplus.com`
- **Deploy:** `CLOUDFLARE_API_TOKEN=y79s_aim-QtIrziq-JT92jGFrdUc-UcbBS5ELulv npx wrangler deploy` (run from this directory)
- **GitHub:** `https://github.com/motplusplusplus/motplusplus-site.git`
- **Framework:** Next.js static export → Cloudflare Workers

## Cloudflare R2 (images)
- **Bucket:** `site-general` (account `31a35595add67ae1366b3f6420432773`)
- **Public URL:** `https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev`
- **Upload token:** `0y5cIePwh8kUz1aBnCZmYIuFJF1IVarrr7RDvWrD`
- **MUST pass** `CLOUDFLARE_ACCOUNT_ID=31a35595add67ae1366b3f6420432773` with wrangler
- Image upload settings: max 1600px, quality 85, JPEG

## Sanity CMS
- **Project ID:** `t5nsm79o`
- **Studio URL:** `https://motplusplus.sanity.studio`
- **Studio local:** `~/Documents/motplus-sanity` → `npm run dev`
- **Client config:** `lib/sanity.ts`
- **Schemas folder:** `sanity-schemas/`
- See full Sanity details in `~/Documents/motplus-sanity/CLAUDE.md`

## Mapbox (+1 Museum map)
- **Token:** stored in `NEXT_PUBLIC_MAPBOX_TOKEN` env var (see memory for value)
- Restricted to: `https://motplusplus.com`, `https://motplusplus-site.motplusplusplus.workers.dev`

## Key data files
- `events-data.json` — 244 events (do NOT edit manually, use scripts/)
- `studios-data.json` — A.Farm studio profiles + images
- `artists-data.json` — all artist profiles
- `lib/events.ts` — AFARM_RESIDENT_SLUGS, BIO_SLUGS, HIDDEN_SLUGS (authoritative lists)

## Important rules
- `AFARM_RESIDENT_SLUGS` in lib/events.ts is sourced from WP XML export — only add slugs confirmed in that XML
- WP XML at: `/Volumes/MoT/EXPORTED DATA/wordpress/motplusplusplus.wordpress.com-2026-03-17-04_52_48/`
- Do NOT include: Luke Schneider, Tra My, or any removed staff anywhere on the site
- Lowercase convention throughout all UI text (intentional MoT+++ voice)
- MoT+++ exact capitalization always

## A.Farm studios (afarm page slugs → studios-data.json slugs must match)
- andrew-newell-walther
- le-phi-long
- quoc-anh-le
- hoang-nam-viet
- karlie-ho
- thom-nguyen

## External drive
- WD drive mounts at `/Volumes/MoT`
- Original event photos: `/Volumes/MoT/EXPORTED DATA/exported from google drive a.farm/`
