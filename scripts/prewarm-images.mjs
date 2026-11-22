#!/usr/bin/env node
// Pre-warm Sanity's image CDN with the /trash grid sizes, after every deploy.
//
// WHY (2026-11-22, +1 trash rework): the grid asks Sanity for resized copies
// (?w=400..1200&auto=format). The first request for a size Sanity has not made
// yet is resized on the spot and is slow (seconds on a phone connection), so
// the first visitors after a deploy or a newly published work waited on it:
// the largest paint on /trash ranged 2.2 s to 3.8 s on throttled 4G. Asking
// once here means every real visitor gets a cached copy.
//
// What it asks for: the first image of every work on the live /trash, at every
// width the grid can request in either view (one per row, dense), plus the
// small blurred placeholder. The work page uses the same widths for that image.
// Each URL is asked for twice, as AVIF (Chrome, Safari 16+, Firefox) and as
// WebP (older Safari), because auto=format caches one copy per format.
//
// Best effort: it never fails a deploy. It reads the work list from the live
// page (the inline order script's data), so it warms exactly what is served.
//
// Usage: node scripts/prewarm-images.mjs [base-url]

const BASE = (process.argv[2] || 'https://motplusplusplus.com').replace(/\/$/, '');
const CONCURRENCY = 8;
const TIMEOUT_MS = 60000;
// Must match lib/workImage.ts (GRID_SINGLE_WIDTHS, GRID_DENSE_WIDTHS, imgSrcSet,
// placeholderUrl). A mismatch only costs warming the wrong sizes, never breaks
// the site; verifyMatches() below warns if the page's own preload code drifts.
const WIDTHS = [240, 400, 600, 800, 1200];
const ACCEPTS = {
  avif: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  webp: 'image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
};
const SANITY = 'https://cdn.sanity.io/images/';

function urlsFor(url, originalWidth) {
  if (!url || !url.startsWith(SANITY)) return [];
  const ws = WIDTHS.filter(w => !originalWidth || w <= originalWidth);
  if (originalWidth && (ws.length === 0 || ws[ws.length - 1] < originalWidth)) ws.push(originalWidth);
  return [
    ...ws.map(w => `${url}?w=${w}&q=75&fit=max&auto=format`),
    `${url}?w=24&q=30&blur=10&fit=max&auto=format`,
  ];
}

async function get(url, accept) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const res = await fetch(url, { headers: { accept, 'user-agent': 'motplus-prewarm' }, signal: ctrl.signal });
    await res.arrayBuffer(); // read it through, so the CDN finishes and stores the copy
    return { ok: res.ok, status: res.status, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, status: err.name === 'AbortError' ? 'timeout' : 'error', ms: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  let html;
  try {
    const res = await fetch(`${BASE}/trash/`, { headers: { 'cache-control': 'no-cache' } });
    html = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn(`⚠️  prewarm: could not read ${BASE}/trash/ (${err.message}); skipped.`);
    return;
  }
  const m = html.match(/var D=(\[[\s\S]*?\]);\s*var K=/);
  if (!m) {
    console.warn('⚠️  prewarm: the /trash order data was not found in the page; skipped.');
    return;
  }
  let data;
  try { data = JSON.parse(m[1]); } catch {
    console.warn('⚠️  prewarm: the /trash order data did not parse; skipped.');
    return;
  }
  for (const w of WIDTHS) {
    if (!html.includes(String(w))) console.warn(`⚠️  prewarm: width ${w} is not in the live page; lib/workImage.ts may have changed.`);
  }

  const urls = [...new Set(data.flatMap(d => urlsFor(d[2], d[3])))];
  const jobs = urls.flatMap(u => Object.values(ACCEPTS).map(a => [u, a]));
  console.log(`prewarm: ${data.length} works, ${urls.length} image sizes, ${jobs.length} requests`);

  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < jobs.length) {
      const [u, a] = jobs[next++];
      results.push(await get(u, a));
    }
  }));
  const failed = results.filter(r => !r.ok);
  const slow = results.filter(r => r.ok && r.ms > 1500).length;
  console.log(`prewarm: ${results.length - failed.length}/${results.length} ok, ${slow} were slow (new sizes, now cached)`);
  if (failed.length) {
    const kinds = {};
    failed.forEach(r => { kinds[r.status] = (kinds[r.status] || 0) + 1; });
    console.warn(`⚠️  prewarm: ${failed.length} failed: ${JSON.stringify(kinds)} (not fatal)`);
  }
}

main().catch(err => { console.warn(`⚠️  prewarm: ${err.message} (not fatal)`); });
