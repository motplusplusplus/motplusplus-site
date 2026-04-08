/**
 * migrate-r2-to-sanity.mjs
 *
 * Migrates R2 URL strings → proper Sanity image assets for:
 *   - afarmHost:  imageUrls[]  → images[]
 *   - trashItem:  legacyImageUrls[] → images[]
 *
 * Run: node scripts/migrate-r2-to-sanity.mjs
 */

import { createClient } from '@sanity/client';
import https from 'https';
import http from 'http';
import { randomBytes } from 'crypto';

const PROJECT_ID = 't5nsm79o';
const DATASET   = 'production';
const TOKEN     = 'skVLifpa3nAXRCC9VJNOMPgqnHtvO393QltCJzyrFzF6InKvBWPp4LtnSD8x9FpOjVFn4MJJCHuUfliNdcnpkrFvutH79AzCAU3TCFINu402cVGsUaKIrf9U5LbAbZysRvZHrqtZ7RTQyJ5TQzjeM2AY6v6isggwfJC6fWCfg8DhSzm3cMXn';

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  apiVersion: '2024-05-23',
  token:     TOKEN,
  useCdn:    false,
});

// ── helpers ────────────────────────────────────────────────────────────────────

function randomKey() {
  return randomBytes(6).toString('hex');
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function contentTypeFromUrl(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase();
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif' };
  return map[ext] || 'image/jpeg';
}

async function uploadToSanity(url) {
  const ct = contentTypeFromUrl(url);
  const buf = await fetchBuffer(url);

  // Upload via REST API (same endpoint that worked earlier)
  const response = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/v2024-05-23/assets/images/${DATASET}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': ct,
      },
      body: buf,
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed (${response.status}): ${text.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.document._id; // e.g. "image-abc123-800x600-jpg"
}

// ── migrate one document ───────────────────────────────────────────────────────

async function migrateDoc(doc, urlField) {
  const urls = doc[urlField];
  if (!urls || urls.length === 0) return;

  console.log(`\n  [${doc._id}] ${urls.length} URLs to migrate...`);

  const newImageItems = [];
  let failed = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`    [${i + 1}/${urls.length}] ${url.split('/').pop()} ... `);
    try {
      const assetId = await uploadToSanity(url);
      newImageItems.push({
        _type: 'image',
        _key:  randomKey(),
        asset: { _type: 'reference', _ref: assetId },
      });
      console.log('✓');
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed++;
    }
  }

  if (newImageItems.length === 0) {
    console.log(`    All uploads failed — skipping patch.`);
    return;
  }

  // Patch the published document directly: append new images + unset the old URL field
  const docId = doc._id.replace(/^drafts\./, '');
  await client
    .patch(docId)
    .setIfMissing({ images: [] })
    .append('images', newImageItems)
    .unset([urlField])
    .commit({ autoGenerateArrayKeys: false });

  console.log(`    → patched (${newImageItems.length} added, ${failed} failed)`);
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  // ── afarmHost ──────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log(' MIGRATING: afarmHost  (imageUrls → images)');
  console.log('═══════════════════════════════════════════');

  const afarmHosts = await client.fetch(
    `*[_type == "afarmHost" && count(imageUrls) > 0]{ _id, name, slug, imageUrls }`
  );
  console.log(`Found ${afarmHosts.length} afarmHost docs with imageUrls`);

  for (const doc of afarmHosts) {
    // Hoang Nam Viet: already migrated in previous run
    if (doc._id === 'b14637a0-e7c3-49a1-b202-3b61ae0c65e5') {
      console.log(`\n▸ ${doc.name} — ALREADY MIGRATED, skipping`);
      continue;
    }
    // Karlie Ho: source images missing from R2 (404) — needs manual re-upload
    if (doc._id === '717eb5bc-dc08-4378-b089-ebdcc69c6ce7') {
      console.log(`\n▸ ${doc.name} — SOURCE IMAGES MISSING FROM R2, skipping (manual upload required)`);
      continue;
    }
    console.log(`\n▸ ${doc.name} (${doc._id})`);
    await migrateDoc(doc, 'imageUrls');
  }

  // ── trashItem ──────────────────────────────────────────────────────────────
  console.log('\n\n═════════════════════════════════════════════════════════');
  console.log(' MIGRATING: trashItem  (legacyImageUrls → images)');
  console.log('═════════════════════════════════════════════════════════');

  const trashItems = await client.fetch(
    `*[_type == "trashItem" && count(legacyImageUrls) > 0]{ _id, title, legacyImageUrls }`
  );
  console.log(`Found ${trashItems.length} trashItem docs with legacyImageUrls`);

  for (const doc of trashItems) {
    console.log(`\n▸ ${doc.title} (${doc._id})`);
    await migrateDoc(doc, 'legacyImageUrls');
  }

  console.log('\n\n✓ Migration complete.\n');
}

run().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
