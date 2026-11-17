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
// It also checks the most recently edited published, active event (title, hero image, every
// uploaded gallery image, and photographer credits) — event pages are built from a different
// query and template than profiles, so a profile check cannot vouch for them.
//
// Usage: node scripts/verify-content.js [--count N] [--events N]   (defaults: 3 artists, 1 event)

'use strict';

const { statSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..');
const BASE_URL = 'https://motplusplusplus.com';
const SANITY = 'https://t5nsm79o.api.sanity.io/v2026-03-20/data/query/production'; // public dataset, no token
const MARGIN_MS = 30 * 1000;

const countArg = process.argv.indexOf('--count');
const COUNT = countArg > -1 ? Number(process.argv[countArg + 1]) || 3 : 3;
const evArg = process.argv.indexOf('--events');
const EVENT_COUNT = evArg > -1 ? Number(process.argv[evArg + 1]) : 1;

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
  // Only profiles with something to compare (bio, portrait, links or images) are picked: a
  // batch of new name-only profiles (e.g. the AAAE credits pass, 2026-11-17) would otherwise
  // fill all 40 slots with nothing checkable and fail the run for no real reason.
  const q = `*[_type == "artist" && active == true && (
      defined(portrait.asset) || count(links) > 0 || count(uploadedImages) > 0 ||
      count(bio) > 0 || (defined(bio) && bio != "")
    )] | order(_updatedAt desc) [0...40] {
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

function builtAt(slug, section = 'profiles') {
  try {
    return statSync(join(ROOT, 'out', section, slug, 'index.html')).mtimeMs;
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

async function fetchEventCandidates() {
  const q = `*[_type == "event" && active == true && coalesce(isBioPage, false) == false] | order(_updatedAt desc) [0...40] {
    "slug": slug.current, title, _updatedAt,
    "imgs": uploadedImages[defined(asset)]{ "url": asset->url, "isPoster": coalesce(isPoster, false), "credit": photographerName }
  }`;
  const res = await fetch(`${SANITY}?query=${encodeURIComponent(q)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Sanity event query failed: HTTP ${res.status}`);
  return (await res.json()).result ?? [];
}

function eventProblems(e, html) {
  const miss = [];
  const text = flatText(html);
  const title = String(e.title ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (title && !text.includes(title)) miss.push('title');
  const imgs = (e.imgs ?? []).filter((i) => i.url);
  const absent = imgs.filter((i) => !html.includes(assetHash(i.url)));
  if (absent.length) miss.push(`gallery images ${absent.length}/${imgs.length} missing`);
  // hero = first .jpg of the page's image list (poster-flagged uploads first), else the first
  // image. Only assertable when an uploaded image is a jpg (otherwise a legacy jpg may win).
  const ordered = [...imgs.filter((i) => i.isPoster), ...imgs.filter((i) => !i.isPoster)];
  const heroSrc = ordered.find((i) => /\.(jpe?g)$/i.test(i.url));
  if (heroSrc && !html.includes(assetHash(heroSrc.url))) miss.push('hero image');
  const credited = imgs.filter((i) => i.credit && i.credit.trim());
  const shown = (text.match(/photo: /g) ?? []).length;
  if (shown !== credited.length) miss.push(`photo credit lines ${shown} live vs ${credited.length} in Sanity`);
  for (const c of new Set(credited.map((i) => i.credit.trim().toLowerCase()))) {
    if (!text.includes(`photo: ${c}`)) miss.push(`photo credit "${c}"`);
  }
  return miss;
}

async function checkLiveEvent(e) {
  let last = [];
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(`${BASE_URL}/events/${e.slug}/?vc=${Date.now()}`, { cache: 'no-store', redirect: 'follow' });
      if (res.status !== 200) last = [`HTTP ${res.status}`];
      else last = eventProblems(e, await res.text());
    } catch (err) {
      last = [`fetch error: ${err.message}`];
    }
    if (last.length === 0) return [];
    if (i < 5) await sleep(5000);
  }
  return last;
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
  let eventsChecked = 0;
  if (EVENT_COUNT > 0) {
    const events = [];
    for (const e of await fetchEventCandidates()) {
      if (!e.slug) continue;
      const built = builtAt(e.slug, 'events');
      if (built === null) continue;
      if (new Date(e._updatedAt).getTime() > built - MARGIN_MS) continue;
      events.push(e);
      if (events.length >= EVENT_COUNT) break;
    }
    if (events.length === 0) {
      console.error('\n❌ verify-content: found no recently edited published event to compare (is out/ present?).');
      process.exit(1);
    }
    console.log(`\nVerifying live EVENT content for ${events.length} recently edited event(s) against Sanity:\n`);
    for (const e of events) {
      const miss = await checkLiveEvent(e);
      eventsChecked++;
      if (miss.length === 0) console.log(`  ✓ /events/${e.slug}/  (edited ${e._updatedAt})`);
      else {
        failed++;
        console.error(`  ✗ /events/${e.slug}/  (edited ${e._updatedAt}) — live is missing: ${miss.join('; ')}`);
      }
    }
  }
  if (failed) {
    console.error(`\n❌ ${failed} live page(s) do not match Sanity. Most likely stale edge-cached HTML`);
    console.error('   (ARCHITECTURE.md §9.2): purge with `node scripts/purge-cache.js --require`, then re-run.');
    process.exit(1);
  }
  console.log(`\n✅ live content matches Sanity (${eligible.length} profile(s), ${eventsChecked} event(s)).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
