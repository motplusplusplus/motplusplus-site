/**
 * export-sanity-backup.mjs
 * Local backup snapshot of all active Sanity content for the MoT+++ site.
 * Now that Sanity is the sole source of truth for events (and artists, studios,
 * museum, trash), run this periodically to keep an offline restorable copy.
 *
 * Writes one JSON file per document type to sanity-backup/ (gitignored), plus a
 * backup-manifest.json with the export timestamp and per-type counts.
 *
 * Run:  node scripts/export-sanity-backup.mjs
 * (Reads are public on this dataset, so no token is required. If a
 *  SANITY_WRITE_TOKEN env var is present it will be used.)
 */
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'sanity-backup');

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN, // optional — dataset reads are public
  useCdn: false,
});

// type → { file, query }. Full documents (no projection) so the backup is restorable.
// `active == true` where the schema has that field; afarmHost has no `active`
// field (it uses `visibility`), so all afarmHost docs are captured.
const TYPES = [
  { type: 'event',           file: 'events.json',           filter: 'active == true' },
  { type: 'artist',          file: 'artists.json',          filter: 'active == true' },
  { type: 'afarmHost',       file: 'afarmHosts.json',       filter: 'true' },
  { type: 'museumLocation',  file: 'museumLocations.json',  filter: 'active == true' },
  { type: 'trashItem',       file: 'trashItems.json',       filter: 'active == true' },
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const exportedAt = new Date().toISOString();
  const counts = {};

  console.log(`Sanity backup — ${exportedAt}`);
  console.log(`Output: ${OUT_DIR}\n`);

  for (const { type, file, filter } of TYPES) {
    const docs = await client.fetch(`*[_type == "${type}" && (${filter})] | order(_id asc)`);
    fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(docs, null, 2));
    counts[type] = docs.length;
    console.log(`  ✓ ${type.padEnd(16)} ${String(docs.length).padStart(4)} docs → ${file}`);
  }

  const manifest = { exportedAt, projectId: 't5nsm79o', dataset: 'production', counts };
  fs.writeFileSync(path.join(OUT_DIR, 'backup-manifest.json'), JSON.stringify(manifest, null, 2));

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\nTotal: ${total} documents backed up.`);
  console.log(`Manifest: sanity-backup/backup-manifest.json`);
}

run().catch(err => { console.error('Backup failed:', err); process.exit(1); });
