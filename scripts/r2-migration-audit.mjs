/**
 * r2-migration-audit.mjs
 *
 * Read-only audit for the R2 bucket migration (ISSUE-002):
 * finds every reference to the old personal bucket
 * (pub-1a24c863e9654cf59be6136420ba1770.r2.dev) across Sanity,
 * the legacy JSON data files, and the app/lib/components codebase.
 *
 * Writes scripts/r2-migration-manifest.json with:
 *   - unique R2 object keys that need copying to the new bucket
 *   - the Sanity docs (with their full URL arrays) that need patching
 *
 * Run: SANITY_WRITE_TOKEN=... node scripts/r2-migration-audit.mjs
 */

import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

const OLD_HOST = 'pub-1a24c863e9654cf59be6136420ba1770.r2.dev';
const URL_RE = new RegExp(`https?://${OLD_HOST}/([^"'\\s)]+)`, 'g');

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2024-05-23',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

function keysFromString(str, set) {
  let m;
  while ((m = URL_RE.exec(str))) {
    set.add(decodeURIComponent(m[1]));
  }
}

function countMatches(str) {
  const m = str.match(new RegExp(`https?://${OLD_HOST}/[^"'\\s)]+`, 'g'));
  return m ? m.length : 0;
}

function scanJsonValue(val, set) {
  if (typeof val === 'string') { keysFromString(val, set); return; }
  if (Array.isArray(val)) { val.forEach(v => scanJsonValue(v, set)); return; }
  if (val && typeof val === 'object') { Object.values(val).forEach(v => scanJsonValue(v, set)); }
}

const allKeys = new Set();
const report = {};
const sanityDocs = [];

// ── Sanity: event.legacyImageUrls ──────────────────────────────────────────
const events = await client.fetch(
  `*[_type == "event" && count(legacyImageUrls[@ match "*${OLD_HOST}*"]) > 0]{_id, "slug": slug.current, legacyImageUrls}`
);
let eventUrlCount = 0;
for (const e of events) {
  const matching = (e.legacyImageUrls || []).filter(u => u.includes(OLD_HOST));
  eventUrlCount += matching.length;
  matching.forEach(u => keysFromString(u, allKeys));
  sanityDocs.push({ _type: 'event', _id: e._id, slug: e.slug, field: 'legacyImageUrls', urls: e.legacyImageUrls });
}
report.eventDocs = events.length;
report.eventUrls = eventUrlCount;

// ── Sanity: artist.legacyImageUrls ─────────────────────────────────────────
const artists = await client.fetch(
  `*[_type == "artist" && count(legacyImageUrls[@ match "*${OLD_HOST}*"]) > 0]{_id, "slug": slug.current, legacyImageUrls}`
);
let artistUrlCount = 0;
for (const a of artists) {
  const matching = (a.legacyImageUrls || []).filter(u => u.includes(OLD_HOST));
  artistUrlCount += matching.length;
  matching.forEach(u => keysFromString(u, allKeys));
  sanityDocs.push({ _type: 'artist', _id: a._id, slug: a.slug, field: 'legacyImageUrls', urls: a.legacyImageUrls });
}
report.artistDocs = artists.length;
report.artistUrls = artistUrlCount;

// ── Sanity: afarmHost.imageUrls ────────────────────────────────────────────
const hosts = await client.fetch(
  `*[_type == "afarmHost" && count(imageUrls[@ match "*${OLD_HOST}*"]) > 0]{_id, "slug": slug.current, imageUrls}`
);
let hostUrlCount = 0;
for (const h of hosts) {
  const matching = (h.imageUrls || []).filter(u => u.includes(OLD_HOST));
  hostUrlCount += matching.length;
  matching.forEach(u => keysFromString(u, allKeys));
  sanityDocs.push({ _type: 'afarmHost', _id: h._id, slug: h.slug, field: 'imageUrls', urls: h.imageUrls });
}
report.afarmHostDocs = hosts.length;
report.afarmHostUrls = hostUrlCount;

// ── JSON data files ─────────────────────────────────────────────────────────
report.jsonFiles = {};
for (const f of ['events-data.json', 'artists-data.json', 'studios-data.json']) {
  const raw = fs.readFileSync(f, 'utf8');
  report.jsonFiles[f] = countMatches(raw);
  scanJsonValue(JSON.parse(raw), allKeys);
}

// ── Codebase: app/, lib/, components/ ───────────────────────────────────────
const codeFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) codeFiles.push(p);
  }
}
for (const dir of ['app', 'lib', 'components']) {
  if (fs.existsSync(dir)) walk(dir);
}
report.codeFiles = {};
for (const f of codeFiles) {
  const raw = fs.readFileSync(f, 'utf8');
  const c = countMatches(raw);
  if (c > 0) {
    report.codeFiles[f] = c;
    keysFromString(raw, allKeys);
  }
}

// ── Output ───────────────────────────────────────────────────────────────────
report.totalUniqueKeys = allKeys.size;

fs.writeFileSync(
  'scripts/r2-migration-manifest.json',
  JSON.stringify({ oldHost: OLD_HOST, keys: [...allKeys].sort(), sanityDocs }, null, 2)
);

console.log(JSON.stringify(report, null, 2));
