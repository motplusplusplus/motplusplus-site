#!/usr/bin/env node
// Post-deploy CONTENT check: the live site must show what Sanity holds.
//
// verify-deploy.js proves the live site serves the just-built BUILD_ID, but that
// is not the same as serving current CONTENT. On 2026-11-17 the Action deployed
// correctly three times (verify-deploy green each time) while profile pages
// for artists edited that morning stayed stale at the edge. This check fetches
// the most recently edited artist profiles from Sanity, fetches each LIVE page,
// and fails if portrait, links, bio start or photographer credits are missing.
//
// Which docs: only artists whose _updatedAt is older than the moment their page
// was generated (mtime of out/profiles/<slug>/index.html, minus a margin) —
// an edit made after the build can legitimately be absent, so it is not a failure.
//
// Usage: node scripts/verify-content.js [--count N]   (default 3)

'use strict';

const { statSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const BASE_URL = 'https://motplusplusplus.com';
const SANITY = 'https://t5nsm79o.api.sanity.io/v2026-03-20/data/query/production'; // public dataset, no token
const MARGIN_MS = 30 * 1000;

const countArg = process.argv.indexOf('--count');
const COUNT = countArg > -1 ? Number(process.argv[countArg + 1]) || 3 : 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
const flatText = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').toLowerCase();
const assetHash = (url) => (url ? url.split('/').pop().split('-')[0] : '');

async function fetchCandidates() {
  const q = `*[_type == "artist" && active == true] | order(_updatedAt desc) [0...40] {
    "slug": slug.current, name, _updatedAt,
    "bio": select(bio._type == "string" => bio, pt::text(bio)),
    "portrait": portrait.asset->url, "portraitCredit": portrait.photographerName,
    links, instagram,
    "imgs": uploadedImages[].asset->url, "credits": uploadedImages[].photographerName
  }`;
  const res = await fetch(`${SANITY}?query=${encodeURIComponent(q)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Sanity query failed: HTTP ${res.status}`);
  return (await res.json()).result ?? [];
}

function builtAt(slug) {
  try {
    return statSync(join(ROOT, 'out', 'profiles', slug, 'index.html')).mtimeMs;
  } catch {
    return null;
  }
}

function problems(a, html) {
  const miss = [];
  const text = flatText(html);
  const lower = decode(html).toLowerCase();
  if (a.portrait && !html.includes(assetHash(a.portrait))) miss.push('portrait');
  for (const l of a.links ?? []) {
    if (!l?.url) continue;
    const ig = l.url.match(/instagram\.com\/([A-Za-z0-9_.]+)/i);
    const needle = (ig ? ig[1] : l.url.replace(/^https?:\/\//, '').replace(/\/$/, '')).toLowerCase();
    if (!lower.includes(needle)) miss.push(`link ${l.url}`);
  }
  if (a.bio) {
    const first = a.bio.trim().split(/\n+/)[0].replace(/\s+/g, ' ').slice(0, 40).toLowerCase();
    if (first && !text.includes(first)) miss.push('bio');
  }
  for (const u of a.imgs ?? []) if (u && !html.includes(assetHash(u))) { miss.push('gallery image'); break; }
  for (const c of new Set([a.portraitCredit, ...(a.credits ?? [])].filter(Boolean))) {
    if (!text.includes(String(c).trim().toLowerCase())) miss.push(`photo credit "${c}"`);
  }
  return miss;
}

async function checkLive(a) {
  let last = [];
  // edge propagation can lag a few seconds after a purge — retry briefly
  for (let i = 0; i < 6; i++) {
    let html = '';
    try {
      const res = await fetch(`${BASE_URL}/profiles/${a.slug}/?vc=${Date.now()}`, { cache: 'no-store', redirect: 'follow' });
      if (res.status !== 200) last = [`HTTP ${res.status}`];
      else { html = await res.text(); last = problems(a, html); }
    } catch (err) {
      last = [`fetch error: ${err.message}`];
    }
    if (last.length === 0) return [];
    if (i < 5) await sleep(5000);
  }
  return last;
}

async function main() {
  const all = await fetchCandidates();
  const eligible = [];
  for (const a of all) {
    if (!a.slug) continue;
    const built = builtAt(a.slug);
    if (built === null) continue; // not in this build (or no out/) — nothing to compare
    if (new Date(a._updatedAt).getTime() > built - MARGIN_MS) continue; // edited after this build
    const checkable = a.portrait || (a.links ?? []).length || a.bio || (a.imgs ?? []).length;
    if (checkable) eligible.push(a);
    if (eligible.length >= COUNT) break;
  }
  if (eligible.length === 0) {
    console.error('\n❌ verify-content: found no recently edited artist profile to compare (is out/ present?).');
    console.error('   Refusing to pass silently — a check that checks nothing is how false confidence starts.');
    process.exit(1);
  }
  console.log(`Verifying live CONTENT for ${eligible.length} recently edited profile(s) against Sanity:\n`);
  let failed = 0;
  for (const a of eligible) {
    const miss = await checkLive(a);
    if (miss.length === 0) console.log(`  ✓ /profiles/${a.slug}/  (edited ${a._updatedAt})`);
    else {
      failed++;
      console.error(`  ✗ /profiles/${a.slug}/  (edited ${a._updatedAt}) — live is missing: ${miss.join('; ')}`);
    }
  }
  if (failed) {
    console.error(`\n❌ ${failed} live profile page(s) do not match Sanity. Most likely stale edge-cached HTML`);
    console.error('   (ARCHITECTURE.md §9.2): purge with `node scripts/purge-cache.js --require`, then re-run.');
    process.exit(1);
  }
  console.log('\n✅ live profile content matches Sanity.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
