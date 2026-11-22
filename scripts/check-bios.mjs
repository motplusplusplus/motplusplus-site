#!/usr/bin/env node
/**
 * Build check (BIO-AUDIT-2026-11-22, A4): stops the bio-splicing mechanism from coming back.
 * Runs before every build (npm "prebuild", and scripts/deploy.js). Reads published Sanity
 * artist bios and FAILS the build when:
 *
 *   1. a sentence of 8+ words appears in two different artists' bios
 *      (real joint text is allowlisted below, by slug pair);
 *   2. a bio contains event-announcement copy (times, "pleased to invite", "participant
 *      artists:", "location:", "opening:", "join us", scraped site chrome);
 *   3. a bio names a different profile's full name or alias as its subject
 *      ("X (b. …", "X is a …").
 *
 * Rule 4 (a profile with a Sanity record shows its Sanity bio only, never an
 * artists-data.json or event-text fallback) is enforced in code, lib/catalogue.ts.
 *
 * Matching folds diacritics for comparison only, with đ/Đ → d by hand (NFD does not
 * decompose it). Full names and aliases only: a surname never counts as a match.
 *
 * Exit 0 = clean. Set CHECK_BIOS_WARN_ONLY=1 to report without failing (local debugging).
 */
import { createClient } from '@sanity/client';

const client = createClient({ projectId: 't5nsm79o', dataset: 'production', apiVersion: '2026-03-20', useCdn: false, perspective: 'published' });

// slug pairs whose bios legitimately share sentences (joint projects)
const SHARED_OK = [['aram-han-sifuentes', 'roberto-sifuentes']];

const fold = s => (s || '').replace(/[đĐ]/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plain = b => (Array.isArray(b) ? b.map(x => (x.children || []).map(c => c.text).join('')).join('\n\n') : b || '');
const sentences = t => fold(t).replace(/\s+/g, ' ').split(/(?<=[.!?;])\s+/).map(x => x.replace(/[^a-z0-9 ]/g, '').trim()).filter(x => x.split(' ').length >= 8);
const EVENT_COPY = [
  [/\b\d{1,2}[:.]\d{2}\s*(am|pm)\b|\b\d{1,2}\s*(am|pm)\s*[-–]\s*\d{1,2}\s*(am|pm)\b/, 'a time of day'],
  [/pleased to (invite|announce|present)/, '"pleased to invite/announce/present"'],
  [/participa(nt|ting) artists?\s*:/, '"participant artists:"'],
  [/(^|\s)location\s*:/, '"location:"'],
  [/(^|\s)opening\s*:/, '"opening:"'],
  [/\bjoin us\b/, '"join us"'],
  [/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday),? (january|february|march|april|may|june|july|august|september|october|november|december) \d/, 'a weekday and date'],
  [/programs residents news|loading comments|write a comment|subscribe subscribed/, 'scraped site chrome'],
];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const artists = await client.fetch(`*[_type == "artist"]{_id, name, "slug": slug.current, "aliases": aliases[].alias, bio}`);
const problems = [];
const okPair = (a, b) => SHARED_OK.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

// 1. shared sentences
const owners = new Map();
for (const a of artists) for (const s of new Set(sentences(plain(a.bio)))) { if (!owners.has(s)) owners.set(s, []); owners.get(s).push(a); }
for (const [s, list] of owners) {
  const uniq = [...new Map(list.map(a => [a._id, a])).values()];
  for (let i = 0; i < uniq.length; i++) for (let j = i + 1; j < uniq.length; j++) {
    if (!okPair(uniq[i].slug, uniq[j].slug)) problems.push(`shared sentence: ${uniq[i].name} (${uniq[i].slug}) and ${uniq[j].name} (${uniq[j].slug}): "${s.slice(0, 90)}…"`);
  }
}
// 2. event copy
for (const a of artists) {
  const t = fold(plain(a.bio)).replace(/\s+/g, ' ');
  for (const [re, what] of EVENT_COPY) { const m = t.match(re); if (m) problems.push(`event copy in ${a.name} (${a.slug}): ${what}, "…${t.slice(Math.max(0, m.index - 40), m.index + 50)}…"`); }
}
// 3. another profile as the subject (full names / aliases of two or more words only)
const forms = artists.flatMap(a => [a.name, ...(a.aliases || [])].filter(n => n && fold(n).split(/\s+/).length >= 2).map(n => ({ id: a._id, who: a.name, n: fold(n) })));
for (const a of artists) {
  const t = fold(plain(a.bio)).replace(/\s+/g, ' ');
  if (!t) continue;
  const own = new Set([fold(a.name), ...(a.aliases || []).map(fold)]);
  for (const f of forms) {
    if (f.id === a._id || own.has(f.n) || [...own].some(o => o.includes(f.n))) continue;
    const re = new RegExp(`(^|[.!?]\\s+)${esc(f.n)}\\s*(\\(b\\b|\\(\\d{4}|is an? |was an? |, born)`);
    if (re.test(t)) problems.push(`${a.name} (${a.slug}) has ${f.who} as the subject of a sentence`);
  }
}

if (!problems.length) { console.log(`check-bios: ${artists.length} bios clean`); process.exit(0); }
console.error(`check-bios: ${problems.length} problem(s). A bio holds text that belongs to someone else or to an event.`);
for (const p of problems) console.error('  - ' + p);
console.error('Fix the bio in the Studio (keep removed text in internalNotes), or, for genuinely shared text, add the slug pair to SHARED_OK in scripts/check-bios.mjs.');
process.exit(process.env.CHECK_BIOS_WARN_ONLY === '1' ? 0 : 1);
