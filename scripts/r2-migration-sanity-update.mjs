/**
 * r2-migration-sanity-update.mjs
 *
 * Patches every Sanity doc listed in scripts/r2-migration-manifest.json
 * (event.legacyImageUrls, artist.legacyImageUrls, afarmHost.imageUrls),
 * replacing the old personal R2 host with the new MoT+++ bucket host.
 *
 * Processes in batches of 20; after each batch, re-fetches one doc from
 * the batch to verify the new host is present.
 *
 * Run: SANITY_WRITE_TOKEN=... node scripts/r2-migration-sanity-update.mjs
 */

import { createClient } from '@sanity/client';
import fs from 'fs';

const OLD_HOST = 'pub-1a24c863e9654cf59be6136420ba1770.r2.dev';
const NEW_HOST = 'pub-136b7c559e56403eb674c24e717611c6.r2.dev';

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2024-05-23',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const manifest = JSON.parse(fs.readFileSync('scripts/r2-migration-manifest.json', 'utf8'));
const docs = manifest.sanityDocs;

const BATCH = 20;
let updated = 0;

for (let i = 0; i < docs.length; i += BATCH) {
  const batch = docs.slice(i, i + BATCH);
  const tx = client.transaction();
  for (const d of batch) {
    const newUrls = d.urls.map(u => u.includes(OLD_HOST) ? u.replace(OLD_HOST, NEW_HOST) : u);
    tx.patch(d._id, p => p.set({ [d.field]: newUrls }));
  }
  await tx.commit();
  updated += batch.length;

  // verify one sample from this batch
  const sample = batch[0];
  const fresh = await client.getDocument(sample._id);
  const field = fresh[sample.field] || [];
  const ok = field.some(u => u.includes(NEW_HOST)) && !field.some(u => u.includes(OLD_HOST));
  console.log(`Batch ${Math.floor(i / BATCH) + 1}: updated ${updated}/${docs.length} docs. Sample ${sample._type} ${sample._id} -> ${ok ? 'OK' : 'CHECK'}`);
}

console.log('Done.');
