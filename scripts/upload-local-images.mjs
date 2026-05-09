/**
 * upload-local-images.mjs
 *
 * Uploads local image files from disk to Sanity and patches the target document.
 * Usage: node scripts/upload-local-images.mjs
 */

import { createClient } from '@sanity/client';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
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

function randomKey() {
  return randomBytes(6).toString('hex');
}

function contentTypeFromExt(ext) {
  const map = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
  return map[ext.toLowerCase().replace('.', '')] || 'image/jpeg';
}

function imageFilesInDir(dir) {
  const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  return readdirSync(dir)
    .filter(f => exts.has(extname(f).toLowerCase()))
    .sort()
    .map(f => join(dir, f));
}

async function uploadFileToSanity(filePath) {
  const ext = extname(filePath);
  const ct  = contentTypeFromExt(ext);
  const buf = readFileSync(filePath);

  const response = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/v2024-05-23/assets/images/${DATASET}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': ct,
        'Content-Disposition': `inline; filename="${basename(filePath)}"`,
      },
      body: buf,
    }
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed (${response.status}): ${text.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.document._id;
}

async function uploadDirToDoc(docId, imageDir, targetField = 'uploadedImages', clearField = null) {
  const files = imageFilesInDir(imageDir);
  if (files.length === 0) {
    console.log(`  No image files found in ${imageDir}`);
    return;
  }

  console.log(`\n  Uploading ${files.length} files from ${imageDir}`);
  console.log(`  → document: ${docId}, field: ${targetField}`);

  const newItems = [];
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    process.stdout.write(`  [${i + 1}/${files.length}] ${basename(f)} ... `);
    try {
      const assetId = await uploadFileToSanity(f);
      newItems.push({
        _type: 'image',
        _key: randomKey(),
        asset: { _type: 'reference', _ref: assetId },
      });
      console.log('✓');
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed++;
    }
  }

  if (newItems.length === 0) {
    console.log('  All uploads failed — skipping patch.');
    return;
  }

  let patch = client
    .patch(docId)
    .setIfMissing({ [targetField]: [] })
    .append(targetField, newItems);

  if (clearField) {
    patch = patch.unset([clearField]);
  }

  await patch.commit({ autoGenerateArrayKeys: false });

  const publishedId = docId.replace(/^drafts\./, '');
  console.log(`  → patched ${publishedId} (${newItems.length} added, ${failed} failed)`);
  return publishedId;
}

async function run() {
  // ── 1. Karlie Ho / La Astoria (afarmHost) ─────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log(' Karlie Ho / La Astoria — studio images');
  console.log('═══════════════════════════════════════════');
  console.log('Note: DSCF files in R2 were 404 (never uploaded). Using La Astoria apartment photos instead.');

  const LA_ASTORIA_DIR = "/Volumes/MoT/EXPORTED DATA/exported from google drive a.farm/Takeout 5/Drive/XX_old A. Farm/Financial Reports /A. Farm Season 4 onward financial plan/Images_A. Farm @ La Astoria /La Astoria apartments";
  const KARLIE_DOC_ID  = '717eb5bc-dc08-4378-b089-ebdcc69c6ce7';

  await uploadDirToDoc(KARLIE_DOC_ID, LA_ASTORIA_DIR, 'images', 'imageUrls');

  // ── 2. MoT sound #7 (event) ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log(' MoT sound #7 — event documentation photos');
  console.log('═══════════════════════════════════════════');

  const SOUND7_DIR    = "/Volumes/MoT/MoT+++ Desktop Archive 2026/Events Documentation/2018-06-23 — MoT sound #7";
  const SOUND7_DOC_ID = 'event-mot-sound-7';

  await uploadDirToDoc(SOUND7_DOC_ID, SOUND7_DIR, 'uploadedImages');

  console.log('\n\n✓ Done.\n');
}

run().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
