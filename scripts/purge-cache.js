#!/usr/bin/env node
// Purge the Cloudflare edge cache for motplusplusplus.com (purge_everything).
//
// WHY THIS EXISTS AS ITS OWN SCRIPT (2026-11-17): the zone's cache rule pins
// HTML at the edge (cf-cache-status: HIT even with must-revalidate), so a
// correct build + correct wrangler deploy can still serve stale profile pages.
// `npm run deploy` always purged; the "Deploy site" GitHub Action did not, so
// Sanity publishes that went through the Action shipped fresh assets behind
// stale cached HTML while every deploy check reported success.
//
// Usage:
//   node scripts/purge-cache.js            # skip with a warning if creds unset (local)
//   node scripts/purge-cache.js --require  # FAIL if creds unset (CI)
//
// Needs CLOUDFLARE_ZONE_ID + CLOUDFLARE_CACHE_PURGE_TOKEN (Zone > Cache Purge > Purge).
// Prefix/wildcard purge is Enterprise-only; purge_everything is cheap for a static site.

'use strict';

const required = process.argv.includes('--require');
const zone = process.env.CLOUDFLARE_ZONE_ID;
const token = process.env.CLOUDFLARE_CACHE_PURGE_TOKEN;

async function main() {
  if (!zone || !token) {
    const msg = 'CLOUDFLARE_ZONE_ID and/or CLOUDFLARE_CACHE_PURGE_TOKEN not set — edge cache NOT purged.';
    if (required) {
      console.error(`\n❌ ${msg}`);
      console.error('   Without a purge, stale cached HTML can be served after a correct deploy (ARCHITECTURE.md §9.2).');
      console.error('   CI: add both as GitHub Actions secrets. Local: add them to .env.local.');
      process.exit(1);
    }
    console.warn(`\n⚠️  ${msg}`);
    console.warn('    verify-deploy / verify-content will still fail loudly on stale HTML.');
    return;
  }
  console.log('\n$ purge Cloudflare edge cache (purge_everything)');
  let parsed;
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ purge_everything: true }),
    });
    parsed = await res.json();
  } catch (err) {
    console.error('  ✗ cache purge request failed:', err.message);
    process.exit(1);
  }
  if (!parsed.success) {
    console.error('  ✗ cache purge failed:', JSON.stringify(parsed.errors));
    console.error('    The token likely lacks Zone > Cache Purge permission (see ISSUE-011).');
    process.exit(1);
  }
  console.log('  ✓ edge cache purged');
}

main();
