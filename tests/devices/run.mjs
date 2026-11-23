// Device test suite for the MoTcyclopedia and events pages (2026-11-22 redesign).
// Runs against live by default:  npm run test:devices            (from the repo root)
//                     elsewhere:  npm run test:devices -- --base=https://example.workers.dev
// Screenshots go to tests/devices/screens/<date>/ (gitignored). Exits 1 if any check fails.
import puppeteer, { KnownDevices } from 'puppeteer';
import fs from 'node:fs';

const arg = k => process.argv.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const BASE = (arg('base') ?? 'https://motplusplusplus.com').replace(/\/$/, '');
const OUT = arg('out') ?? new URL(`./screens/${new Date().toISOString().slice(0, 10)}`, import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });

// Test subjects are picked from the (public) Sanity dataset, so the checks do not depend on
// one event keeping a given photo or translation.
const SANITY = 'https://t5nsm79o.apicdn.sanity.io/v2026-03-20/data/query/production?query=';
const groq = async q => (await (await fetch(SANITY + encodeURIComponent(q))).json()).result ?? [];
const LIVE = '_type == "event" && active == true && !(_id in path("drafts.**")) && isBioPage != true';
/** Events whose description exists in both English and Vietnamese. */
const bilingualEvents = () => groq(`*[${LIVE} && length(vnDescription) > 200 && length(description) > 200] | order(dateISO desc)[0...12].slug.current`);
/** Events whose cover (the page hero: event.coverImage holds an uploadedImages _key) is a photo at least 1600 px wide. */
const wideHeroEvents = () => groq(`*[${LIVE} && uploadedImages[_key == ^.coverImage][0].asset->metadata.dimensions.width >= 1600 && uploadedImages[_key == ^.coverImage][0].isPoster != true] | order(dateISO desc)[0...12].slug.current`);

const DEVICES = {
  iphone: KnownDevices['iPhone 15'],
  pixel: KnownDevices['Pixel 7'] ?? { viewport: { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36' },
  desktop: { viewport: { width: 1440, height: 900, deviceScaleFactor: 1 }, userAgent: '' },
};
const SHOTS = [
  ['profiles-index', '/profiles/'],
  ['events-index', '/events/'],
  ['now-and-next', '/events/?now=2026-10-25'],
  ['rich-profile', '/profiles/cam-xanh/'],
  ['sparse-profile', '/profiles/thai-nhat-minh/'],
  ['rich-event', '/events/password-01-group-show/'],
  ['imageless-event', '/events/ke/'],
];
const results = [];
const log = (k, ok, info = '') => { results.push({ k, ok, info }); console.log(ok ? 'PASS' : 'FAIL', k, info); };

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts?.ready;
    // walk down to trigger lazy images in the first screens, then back up
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 1200));
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const [dname, dev] of Object.entries(DEVICES)) {
    const page = await browser.newPage();
    if (dev.userAgent) await page.setUserAgent(dev.userAgent);
    await page.setViewport(dev.viewport);
    for (const [name, path] of SHOTS) {
      await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 60000 });
      await settle(page);
      await page.screenshot({ path: `${OUT}/${name}--${dname}.png` });
      if (name.startsWith('rich') && dname !== 'desktop') await page.screenshot({ path: `${OUT}/${name}--${dname}--full.png`, fullPage: true });
      const hs = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      log(`no sideways scroll ${name} ${dname}`, hs <= 0, `overflow ${hs}px`);
      if (name === 'profiles-index') {
        // 2026-11-23: /profiles opens with title, filter/search and the A–Z list; the portrait grid follows it
        const v = await page.evaluate(() => {
          const inView = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.width > 0; };
          const names = [...document.querySelectorAll('#pf-az .c-az-list a')].filter(inView).length;
          const g = document.getElementById('pf-featured'), az = document.getElementById('pf-az');
          const after = !!(g && az && (az.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING));
          const cols = g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0;
          const tilesInView = [...document.querySelectorAll('#pf-featured .c-tile')].filter(inView).length;
          return { names, after, cols, tilesInView, title: inView(document.querySelector('.c-h1')) };
        });
        log(`first screen shows the A–Z list ${dname}`, v.title && v.names >= 5 && v.tilesInView === 0, `${v.names} names in view, ${v.tilesInView} portrait tiles in view`);
        log(`portrait grid follows the A–Z list ${dname}`, v.after);
        const want = dname === 'desktop' ? 8 : 3;
        log(`portrait grid columns ${dname}`, v.cols === want, `${v.cols} (want ${want})`);
        await page.evaluate(() => document.getElementById('pf-featured')?.scrollIntoView());
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: `${OUT}/${name}--${dname}--grid.png` });
      } else if (name.endsWith('index') || name === 'now-and-next') {
        const imgs = await page.evaluate(() => [...document.images].filter(i => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.width > 40 && i.complete && i.naturalWidth > 0; }).length);
        log(`first screen shows images ${name} ${dname}`, name === 'events-index' && dname !== 'desktop' ? true : imgs > 0, `${imgs} loaded images in view${name === 'events-index' && dname !== 'desktop' ? ' (list view on phones by design)' : ''}`);
      }
    }
    await page.close();
  }

  // ── /profiles portrait grid on a tablet: 4 columns ──
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(BASE + '/profiles/', { waitUntil: 'networkidle2', timeout: 60000 });
    const cols = await page.evaluate(() => getComputedStyle(document.getElementById('pf-featured')).gridTemplateColumns.split(' ').length);
    log('portrait grid columns tablet', cols === 4, `${cols} (want 4)`);
    await page.close();
  }

  // ── sideways scroll across a sample of pages on a phone ──
  {
    const page = await browser.newPage();
    await page.setUserAgent(DEVICES.iphone.userAgent); await page.setViewport(DEVICES.iphone.viewport);
    const sample = ['/profiles/dinh-q-le/', '/profiles/nguyen-giao-xuan/', '/profiles/lena-bui/', '/profiles/andy-harper/', '/events/mot-sound-24-out-of-landscape-into-mindscape-future-basketball/', '/events/in-between-frames-i-dream-the-dreams-i-have-been-dreaming/', '/events/all-animals-are-equal-2/', '/wall/', '/trash/'];
    let worst = 0, where = '';
    for (const p of sample) { await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 }); const hs = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (hs > worst) { worst = hs; where = p; } }
    log('no sideways scroll on 9 more pages (iPhone)', worst <= 0, worst ? `${worst}px on ${where}` : '');
    await page.close();
  }

  // ── viewer: zoom stops at real pixels; back closes; swipe down closes ──
  {
    const page = await browser.newPage();
    await page.setViewport(DEVICES.desktop.viewport);
    // a hero at least 1600 px wide, so "zoom" has real pixels to go to
    let subject = null;
    for (const slug of await wideHeroEvents()) {
      await page.goto(BASE + `/events/${slug}/`, { waitUntil: 'networkidle2' });
      if (await page.$('.c-ev-hero')) { subject = slug; break; }
    }
    if (!subject) { log('viewer zoom stops at 100% of real pixels', false, 'no event with a hero 1600 px or wider'); await page.goto(BASE + '/events/password-01-group-show/', { waitUntil: 'networkidle2' }); }
    await page.click('.c-ev-hero');
    await page.waitForSelector('.pswp--open', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));
    // the drawn <img> of the current slide (not a placeholder, not a neighbour slide)
    const current = () => page.evaluate(() => {
      const i = [...document.querySelectorAll('img.pswp__img')].find(x => { const r = x.getBoundingClientRect(); return x.naturalWidth > 0 && r.width > 50 && r.right > 0 && r.left < innerWidth; });
      return i ? { shown: Math.round(i.getBoundingClientRect().width), natural: i.naturalWidth, src: i.currentSrc.split('/').pop() } : null;
    });
    const fitted = await current();
    await page.click('.pswp__button--zoom').catch(() => {}); await new Promise(r => setTimeout(r, 900));
    const zoomed = await current();
    // the zoom button toggles (zoomed ↔ fitted): a second press must never go past real pixels
    await page.click('.pswp__button--zoom').catch(() => {}); await new Promise(r => setTimeout(r, 900));
    const again = await current();
    if (subject) log('viewer zoom stops at 100% of real pixels', !!zoomed && zoomed.natural >= 1600 && zoomed.shown > (fitted?.shown ?? 0) && zoomed.shown <= zoomed.natural + 1 && !!again && again.shown <= again.natural + 1,
      `${subject}: fitted ${fitted?.shown}px, zoomed ${zoomed?.shown}px of ${zoomed?.natural}px real, second press ${again?.shown}px`);
    const hashOpen = await page.evaluate(() => location.hash);
    await page.goBack(); await new Promise(r => setTimeout(r, 700));
    const closed = await page.evaluate(() => !document.querySelector('.pswp--open'));
    log('back closes the viewer', closed && /#view-/.test(hashOpen), `hash while open ${hashOpen}`);
    await page.close();

    const ph = await browser.newPage();
    await ph.setUserAgent(DEVICES.iphone.userAgent); await ph.setViewport(DEVICES.iphone.viewport);
    await ph.goto(BASE + '/profiles/cam-xanh/', { waitUntil: 'networkidle2' });
    await ph.tap('.c-prof-portrait');
    await ph.waitForSelector('.pswp--open', { timeout: 8000 });
    await new Promise(r => setTimeout(r, 700));
    const cdp = await ph.createCDPSession();
    const pts = [[196, 400], [196, 470], [196, 560], [196, 660], [196, 760]];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
    for (const [x, y] of pts.slice(1)) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await new Promise(r => setTimeout(r, 30)); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await new Promise(r => setTimeout(r, 900));
    const gone = await ph.evaluate(() => !document.querySelector('.pswp--open'));
    log('swipe down closes the viewer (iPhone)', gone);
    // shared link opens straight into the viewer
    await ph.goto(BASE + '/events/password-01-group-show/#view-2', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    log('share link #view-N opens the viewer', await ph.evaluate(() => !!document.querySelector('.pswp--open')));
    await ph.close();
  }

  // ── search with and without diacritics ──
  {
    const page = await browser.newPage();
    await page.setViewport(DEVICES.desktop.viewport);
    const count = async (path, sel, q) => {
      await page.goto(BASE + path + '?q=' + encodeURIComponent(q), { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1500));
      return page.evaluate(s => document.querySelectorAll(s).length, sel);
    };
    const a = await count('/profiles/', '.c-tiles .c-tile', 'dang'), b = await count('/profiles/', '.c-tiles .c-tile', 'Đặng');
    const marks = await page.evaluate(() => [...document.querySelectorAll('.c-tile mark')].slice(0, 3).map(m => m.textContent));
    log('profiles search: "dang" = "Đặng"', a > 0 && a === b, `${a} vs ${b}, highlights ${JSON.stringify(marks)}`);
    const visible = '#ev-archive li[data-slug]:not([hidden])';
    const c = await count('/events/', visible, 'ke'), d = await count('/events/', visible, 'kệ');
    log('events search: "ke" ⊇ "kệ" (folding)', d > 0 && c >= d, `${c} vs ${d}`);
    const e1 = await count('/events/', visible, 'nguyen'), e2 = await count('/events/', visible, 'Nguyễn');
    log('events search: "nguyen" = "Nguyễn"', e1 > 0 && e1 === e2, `${e1} vs ${e2}`);
    const total = await count('/events/', '#ev-archive li[data-slug]', '');
    log('every listed event is in the index', total > 0, `${total} items`);
    // browse filter
    await page.goto(BASE + '/profiles/?program=MoTsound', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    const ms = await page.evaluate(() => document.querySelectorAll('.c-tiles .c-tile').length);
    log('browse filter (program = MoTsound)', ms > 0, `${ms} people`);
    await page.close();
  }

  // ── EN / VN switch: on an event that has Vietnamese text ──
  {
    const page = await browser.newPage();
    await page.setViewport(DEVICES.desktop.viewport);
    let subject = null;
    for (const slug of await bilingualEvents()) {
      await page.goto(BASE + `/events/${slug}/`, { waitUntil: 'networkidle2' });
      if (await page.$('.c-lang button[lang="vi"]')) { subject = slug; break; }
    }
    if (subject) {
      const shown = () => page.evaluate(() => [...document.querySelectorAll('.c-prose')].find(p => p.offsetParent !== null)?.getAttribute('lang'));
      await page.click('.c-lang button[lang="vi"]');
      await new Promise(r => setTimeout(r, 300));
      const vis = await shown();
      await page.reload({ waitUntil: 'networkidle2' });
      const kept = await shown();
      log('EN/VN switch shows VN and is remembered for the session', vis === 'vi' && kept === 'vi', `${subject}: after click ${vis}, after reload ${kept}`);
      await page.screenshot({ path: `${OUT}/en-vn-switch--desktop.png` });
    } else log('EN/VN switch', false, 'no bilingual event shows the switch');
    // a search with no match shows nothing
    await page.goto(BASE + '/profiles/?q=zzqqxx', { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 1500));
    log('profiles search with no match shows nothing', await page.evaluate(() => [...document.querySelectorAll('.c-tiles .c-tile')].filter(t => t.offsetParent !== null).length === 0 && /nothing matches/.test(document.body.innerText)));
    await page.close();
  }
} finally {
  await browser.close();
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
}
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed${failed.length ? ': ' + failed.map(r => r.k).join('; ') : ''}`);
process.exit(failed.length ? 1 : 0);
