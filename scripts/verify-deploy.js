#!/usr/bin/env node
// Post-deploy verification: checks that all large JS chunks are accessible on the live site.
//
// Background: Cloudflare Workers Assets sometimes silently fails to serve large files
// (>500KB) after marking them as "already uploaded" — they return 404 in production even
// though wrangler reports a successful deploy. This has broken the museum map at least twice
// because the 1.7MB mapbox-gl bundle is the exact size range affected.
//
// Run after every wrangler deploy: npm run verify-deploy
// If a chunk fails, see the printed fix instructions.

'use strict';

const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const CHUNKS_DIR = join(__dirname, '..', 'out', '_next', 'static', 'chunks');
const BASE_URL = 'https://motplusplusplus.com';
const SIZE_THRESHOLD = 500 * 1024; // 500KB

async function main() {
  let allFiles;
  try {
    allFiles = readdirSync(CHUNKS_DIR);
  } catch {
    console.error(`Cannot read ${CHUNKS_DIR} — run npm run build first.`);
    process.exit(1);
  }

  const largeChunks = allFiles
    .filter(f => f.endsWith('.js'))
    .filter(f => statSync(join(CHUNKS_DIR, f)).size > SIZE_THRESHOLD);

  if (largeChunks.length === 0) {
    console.log('No large chunks found — nothing to verify.');
    process.exit(0);
  }

  console.log(`Verifying ${largeChunks.length} large chunk(s) (>${Math.round(SIZE_THRESHOLD / 1024)}KB) on ${BASE_URL}...`);

  const failures = [];
  for (const file of largeChunks) {
    const url = `${BASE_URL}/_next/static/chunks/${file}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        console.log(`  ✓ ${file}`);
      } else {
        console.error(`  ✗ ${file} — HTTP ${res.status}`);
        failures.push(file);
      }
    } catch (err) {
      console.error(`  ✗ ${file} — ${err.message}`);
      failures.push(file);
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} chunk(s) are 404 on the live site.`);
    console.error('Cloudflare silently dropped these large files. Fix:');
    console.error('  1. Make a trivial edit to any source file in the failing chunk');
    console.error('     (e.g. tweak a constant in components/MuseumMap.tsx)');
    console.error('  2. Commit and push the change to origin/main');
    console.error('  3. Re-run: npm run deploy');
    process.exit(1);
  }

  console.log('\nAll chunks verified ✓');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
