# events-data.json — LEGACY ARCHIVE

**Legacy archive — all events now in Sanity. This file is retained as a backup
snapshot. Do not edit manually.**

As of the 2026-06-12 migration session, every publicly-listed event has been
migrated into Sanity (`event` documents, project `t5nsm79o`), which is now the
sole source of truth for events. `events-data.json` is kept only because:

1. It is a backup snapshot of the pre-migration event corpus.
2. `lib/sanity.ts` still reads it to supply **legacy image URLs** during the
   per-slug image merge (`legacyImages`) — Sanity wins on every other field.

The site's merge logic (`app/events/page.tsx`, `app/events/[slug]/page.tsx`)
already prefers the Sanity copy on any slug collision, so the JSON entries for
migrated events are ignored except for images.

A machine note explaining this also lives at the `import eventsDataRaw` line in
`lib/sanity.ts`. (A comment cannot be embedded in the JSON itself — it is a
top-level array that is imported and iterated.)

To regenerate a fresh backup of the live Sanity data, run:

```
node scripts/export-sanity-backup.mjs
```
