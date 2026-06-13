/**
 * Migration complete 2026-06-12. Retained for reference only. Do not re-run.
 *
 * migrate-json-only-events.mjs
 * Migrates the JSON-only public events (from scripts/json-only-events-audit.json)
 * into Sanity. Uses the audit as the authoritative slug+category list, and pulls
 * the full record (verbatim description, all fields, images) from events-data.json.
 *
 * Rules enforced:
 *  - Sanity wins on slug collision: any audit slug already present in Sanity
 *    (by slug, under ANY _id) is skipped, never overwritten.
 *  - Full text preservation: description copied verbatim from events-data.json.
 *  - active: true on every migrated event.
 *  - Images copied as legacyImageUrls (R2 URLs), uploadedImages left empty.
 *  - Category normalized: "+a.farm" -> "+a.Farm".
 *  - Batched in groups of 10; Sanity event count verified after each batch.
 *
 * Run: SANITY_WRITE_TOKEN=... node scripts/migrate-json-only-events.mjs
 */
import { createClient } from '@sanity/client';
import fs from 'fs';

const client = createClient({
  projectId: 't5nsm79o', dataset: 'production', apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN, useCdn: false,
});

const audit = JSON.parse(fs.readFileSync(new URL('./json-only-events-audit.json', import.meta.url)));
const eventsData = JSON.parse(fs.readFileSync(new URL('../events-data.json', import.meta.url)));
const edBySlug = new Map(eventsData.map(e => [e.slug, e]));

const normCat = c => (c === '+a.farm' ? '+a.Farm' : (c || ''));

// Flatten audit into [{slug, category}]
const auditList = [];
for (const [cat, arr] of Object.entries(audit.categories)) {
  for (const e of arr) auditList.push({ slug: e.slug, category: cat });
}

const sanitySlugs = new Set(await client.fetch(`*[_type=="event"].slug.current`));
const startCount = await client.fetch(`count(*[_type=="event"])`);
console.log(`Sanity events before migration: ${startCount}`);

const toCreate = auditList.filter(x => !sanitySlugs.has(x.slug));
const skipped = auditList.filter(x => sanitySlugs.has(x.slug));
console.log(`Audit total: ${auditList.length} | already in Sanity (skip): ${skipped.length} | to create: ${toCreate.length}\n`);

function buildDoc({ slug, category }) {
  const e = edBySlug.get(slug);
  if (!e) throw new Error(`No events-data.json record for ${slug}`);
  const doc = {
    _type: 'event',
    _id: `event-${slug}`,
    slug: { _type: 'slug', current: slug },
    title: e.title || '',
    vnTitle: e.vnTitle || undefined,
    dateISO: e.dateISO || e.sortDate || undefined,
    endDateISO: e.endDateISO || undefined,
    displayDate: e.displayDate || '',
    category: normCat(e.category || category),
    location: e.location || '',
    description: e.description || '',          // verbatim, never truncated
    vnDescription: e.vnDescription || undefined,
    legacyImageUrls: (e.images || []).filter(Boolean),
    uploadedImages: [],
    videoUrl: e.videoUrl || undefined,
    bandcampAlbumId: e.bandcampAlbumId || undefined,
    wpLink: e.wpLink || undefined,
    isBioPage: false,
    active: true,
  };
  Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);
  return doc;
}

const results = { created: [], failed: [] };
const BATCH = 10;
for (let i = 0; i < toCreate.length; i += BATCH) {
  const batch = toCreate.slice(i, i + BATCH);
  const n = Math.floor(i / BATCH) + 1;
  console.log(`── Batch ${n} (${batch.length} events) ──`);
  for (const item of batch) {
    try {
      const doc = buildDoc(item);
      const res = await client.createIfNotExists(doc);
      results.created.push(item.slug);
      console.log(`  ✓ ${item.slug}  [${doc.category}]  desc=${doc.description.length} chars, imgs=${doc.legacyImageUrls.length}`);
    } catch (err) {
      results.failed.push({ slug: item.slug, error: err.message });
      console.log(`  ✗ ${item.slug}: ${err.message}`);
    }
  }
  const liveCount = await client.fetch(`count(*[_type=="event"])`);
  console.log(`  → Sanity event count now: ${liveCount} (expected ${startCount + results.created.length})\n`);
}

const endCount = await client.fetch(`count(*[_type=="event"])`);
console.log('════════════════════════════════════');
console.log(`Created: ${results.created.length} | Failed: ${results.failed.length}`);
console.log(`Sanity events: ${startCount} → ${endCount} (Δ ${endCount - startCount})`);
if (results.failed.length) console.log('FAILURES:', JSON.stringify(results.failed, null, 2));

// Verify all 82 audit slugs now exist in Sanity
const nowSlugs = new Set(await client.fetch(`*[_type=="event"].slug.current`));
const stillMissing = auditList.filter(x => !nowSlugs.has(x.slug)).map(x => x.slug);
console.log(`\nAll 82 audit slugs present in Sanity? ${stillMissing.length === 0 ? 'YES' : 'NO — missing: ' + JSON.stringify(stillMissing)}`);

// Sample 5 newly-created events: verify full description intact vs events-data.json
console.log('\n── Description-integrity spot check (5 created) ──');
const sample = results.created.slice(0, 5);
for (const slug of sample) {
  const live = await client.fetch(`*[_type=="event" && slug.current==$s][0]{ "d": description }`, { s: slug });
  const src = edBySlug.get(slug).description || '';
  const ok = live.d === src;
  console.log(`  ${ok ? '✓' : '✗'} ${slug}: live=${live.d.length} src=${src.length} ${ok ? 'IDENTICAL' : 'MISMATCH'}`);
}
