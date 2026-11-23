// NO TRACKERS check: every request a page makes on load (and after scrolling to the end), grouped by host,
// plus every cookie the browser holds afterwards. Desktop and iPhone.
import puppeteer, { KnownDevices } from 'puppeteer';
const BASE = (process.argv.find(a => a.startsWith('--base='))?.slice(7) ?? 'https://motplusplusplus.com').replace(/\/$/, '');
const PAGES = ['/', '/profiles/', '/profiles/cam-xanh/', '/profiles/huong-dona/', '/events/', '/events/password-01-group-show/', '/events/mot-sound-14-aschismism/', '/trash/', '/wall/', '/afarm/studios/hoang-thi/'];
const browser = await puppeteer.launch({ headless: true });
const own = new URL(BASE).host;
const hosts = new Map();
let cookies = [];
for (const dev of ['desktop', 'iphone']) {
  const page = await browser.newPage();
  if (dev === 'iphone') await page.emulate(KnownDevices['iPhone 15']); else await page.setViewport({ width: 1440, height: 900 });
  page.on('request', r => {
    const h = new URL(r.url()).host;
    if (h === own || r.url().startsWith('data:')) return;
    const k = `${h} (${r.resourceType()})`;
    if (!hosts.has(k)) hosts.set(k, new Set());
    hosts.get(k).add(new URL(page.url()).pathname);
  });
  for (const p of PAGES) {
    await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {});
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
    await new Promise(r => setTimeout(r, 800));
  }
  const cdp = await page.createCDPSession();
  cookies = cookies.concat((await cdp.send('Network.getAllCookies')).cookies.map(c => `${c.domain} ${c.name}`));
  await page.close();
}
await browser.close();
console.log('third-party hosts requested on load (host, type → pages):');
for (const [k, v] of [...hosts].sort()) console.log(`  ${k} → ${[...v].slice(0, 4).join(', ')}${v.size > 4 ? ` +${v.size - 4}` : ''}`);
console.log('cookies set:', cookies.length ? [...new Set(cookies)].join('; ') : 'none');
