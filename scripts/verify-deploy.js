#!/usr/bin/env node
// Post-deploy verification. Run after every wrangler deploy: npm run verify-deploy
//
// Catches THREE distinct failure modes that have each broken production:
//
//  1. STALE ASSET MANIFEST (ISSUE-011 / 2026-06-13): the worker script updates but the
//     deployed version keeps serving an OLD static-asset set, so the live site silently
//     serves months-old content. The whole site was stuck on an April build because of
//     this. Detect by requesting a build-id-specific asset (a unique URL that cannot be an
//     edge-cache artifact) and asserting it is actually served.
//  2. STALE EDGE-CACHED HTML: a zone "Cache Everything" rule can pin old HTML even after a
//     correct asset deploy. Detect by asserting the live homepage embeds the new BUILD_ID.
//  3. LARGE-CHUNK 404 (the original check): Workers Assets sometimes silently 404s files
//     >500KB after marking them "already uploaded" — this broke the museum map twice.

'use strict';

const { readdirSync, statSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'out');
const CHUNKS_DIR = join(OUT, '_next', 'static', 'chunks');
const BASE_URL = 'https://motplusplusplus.com';
const SIZE_THRESHOLD = 500 * 1024; // 500KB

function getBuildId() {
  // Prefer .next/BUILD_ID; fall back to the build-id dir name under out/_next/static.
  const idFile = join(ROOT, '.next', 'BUILD_ID');
  if (existsSync(idFile)) {
    const id = readFileSync(idFile, 'utf8').trim();
    if (id) return id;
  }
  try {
    const dirs = readdirSync(join(OUT, '_next', 'static')).filter((d) => d !== 'chunks' && d !== 'media');
    if (dirs.length === 1) return dirs[0];
  } catch {
    /* fall through */
  }
  console.error('Cannot determine BUILD_ID (.next/BUILD_ID missing and no unique build-id dir in out/_next/static). Run npm run build first.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Edge propagation / cache revalidation can lag a few seconds after deploy — retry briefly
// before declaring failure, so a correct deploy isn't flagged by a transient miss.
async function withRetry(check, { tries = 6, delayMs = 5000 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    last = await check();
    if (last === true) return true;
    if (i < tries - 1) await sleep(delayMs);
  }
  return last; // last falsy/string result, for the error message
}

async function status(url, method = 'HEAD') {
  try {
    const res = await fetch(url, { method, cache: 'no-store' });
    return res.status;
  } catch (err) {
    return `ERR ${err.message}`;
  }
}

async function main() {
  const buildId = getBuildId();
  console.log(`Verifying live deploy on ${BASE_URL} for BUILD_ID ${buildId} ...\n`);

  // 1. New build-id asset must actually be served (proves the asset manifest advanced).
  const manifestUrl = `${BASE_URL}/_next/static/${buildId}/_buildManifest.js`;
  const manifestOk = await withRetry(async () => (await status(manifestUrl)) === 200);
  if (manifestOk !== true) {
    console.error(`❌ CRITICAL: live site is serving a STALE build — expected ${buildId}.`);
    console.error(`   ${manifestUrl}`);
    console.error(`   returned ${manifestOk} (expected 200): the new assets are NOT in the deployed`);
    console.error('   version. The asset upload "succeeded" but the manifest did not advance.');
    console.error('   Likely causes / fixes:');
    console.error('     • Outdated wrangler — upgrade: npm install -D wrangler@latest');
    console.error('     • The GitHub "Deploy site" Action re-deployed an older build over this one');
    console.error('       — confirm it is disabled: gh workflow list --all');
    console.error('   See ARCHITECTURE.md §9 and ISSUES.md ISSUE-011, then re-run: npm run deploy');
    process.exit(1);
  }
  console.log(`  ✓ live serves new build-id assets (/_next/static/${buildId}/_buildManifest.js → 200)`);

  // 2. Live homepage HTML must embed the new BUILD_ID (catches stale edge-cached HTML).
  const homeOk = await withRetry(async () => {
    try {
      const html = await (await fetch(`${BASE_URL}/?vd=${Date.now()}`, { cache: 'no-store' })).text();
      return html.includes(buildId);
    } catch {
      return false;
    }
  });
  if (homeOk !== true) {
    console.error(`\n❌ CRITICAL: new assets are live but the homepage HTML does NOT embed ${buildId}.`);
    console.error('   A Cloudflare "Cache Everything" zone rule is serving a stale cached page');
    console.error('   (ISSUE-011). Fix: purge the zone cache, or set CLOUDFLARE_ZONE_ID +');
    console.error('   CLOUDFLARE_CACHE_PURGE_TOKEN in .env.local so npm run deploy purges automatically.');
    process.exit(1);
  }
  console.log('  ✓ live homepage embeds the new BUILD_ID (no stale edge-cached HTML)');

  // 3. Large-chunk reachability (Workers Assets >500KB silent-404 bug).
  let largeChunks;
  try {
    largeChunks = readdirSync(CHUNKS_DIR)
      .filter((f) => f.endsWith('.js'))
      .filter((f) => statSync(join(CHUNKS_DIR, f)).size > SIZE_THRESHOLD);
  } catch {
    console.error(`\nCannot read ${CHUNKS_DIR} — run npm run build first.`);
    process.exit(1);
  }

  if (largeChunks.length === 0) {
    console.log('  • no large chunks (>500KB) to verify');
  } else {
    console.log(`\nVerifying ${largeChunks.length} large chunk(s) (>${Math.round(SIZE_THRESHOLD / 1024)}KB):`);
    const failures = [];
    for (const file of largeChunks) {
      const code = await status(`${BASE_URL}/_next/static/chunks/${file}`);
      if (code === 200) console.log(`  ✓ ${file}`);
      else {
        console.error(`  ✗ ${file} — HTTP ${code}`);
        failures.push(file);
      }
    }
    if (failures.length > 0) {
      console.error(`\n${failures.length} large chunk(s) are 404 on the live site (Workers Assets large-file bug).`);
      console.error('Fix: make a trivial edit to components/MuseumMap.tsx, commit, push, and re-run npm run deploy.');
      process.exit(1);
    }
  }

  console.log('\n✅ All deploy verifications passed — live site serves the current build.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
