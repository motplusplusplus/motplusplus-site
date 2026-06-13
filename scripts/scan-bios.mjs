// One-off diagnostic: scan active artist bios for corruption signals.
// Read-only. Run: node scripts/scan-bios.mjs
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  useCdn: false,
});

const norm = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const active = await client.fetch(
  `*[_type=="artist" && active==true]{ "id":_id, name, "slug": slug.current, "bio": coalesce(pt::text(bio), bio), nationality, originCity, currentCity }`
);
// Full roster (active + inactive) of names, for cross-reference in bio text.
const roster = await client.fetch(
  `*[_type=="artist" && defined(name)]{ "id":_id, name, "slug": slug.current }`
);

// Candidate names to search for inside bios: full names with >=2 tokens, length>=8,
// and a reasonably distinctive form. Pre-normalize.
const candidates = roster
  .filter((r) => r.name && r.name.trim().split(/\s+/).length >= 2 && r.name.length >= 8)
  .map((r) => ({ id: r.id, slug: r.slug, name: r.name, n: ' ' + norm(r.name) + ' ' }));

const COUNTRY_HINTS = [
  'indonesia','yogyakarta','yojakarta','bandung','solo,','jakarta','bali',
  'thailand','bangkok','chiang mai','chiangmai','philippines','manila',
  'malaysia','singapore','korea','seoul','japan','tokyo','macau','shanghai',
  'hong kong','taiwan','cambodia','phnom penh','myanmar','poland','germany',
  'paris','france','switzerland','los angeles',
];

// Known-corrupt text fragments (the Aliansyah Caniago bio leaked into several docs)
const CORRUPT_FRAGMENTS = [
  'bandung institute of technology',
  'melati suryodarmo',
  'disciples of melati',
  'bagus mazasupa',
];

const corrupt = [];   // high-confidence: bio is about someone else / stitched
const eventBlurb = []; // bio is an event participant-list, not a real bio of the person
const minor = [];      // weaker signals, for completeness

for (const a of active) {
  const bio = a.bio || '';
  if (!bio.trim()) continue;
  const nb = ' ' + norm(bio) + ' ';
  const selfN = norm(a.name);
  // distinctive self tokens (drop very common ones / short)
  const selfTokens = selfN.replace(/[()]/g, ' ').split(/\s+/).filter((t) => t.length >= 4);

  // does the artist's own name appear in their bio, and where?
  const selfFull = nb.includes(' ' + selfN.replace(/[()]/g, '').replace(/\s+/g,' ').trim() + ' ');
  const firstSelfTokenIdx = selfTokens
    .map((t) => nb.indexOf(' ' + t))
    .filter((i) => i >= 0)
    .sort((x, y) => x - y)[0];
  const selfPresent = selfFull || firstSelfTokenIdx >= 0;
  const selfPosRatio = firstSelfTokenIdx >= 0 ? firstSelfTokenIdx / nb.length : 1;

  // pronoun switch
  const hasHe = /\b(he|his)\b/.test(nb);
  const hasShe = /\b(she|her)\b/.test(nb);
  const pronounSwitch = hasHe && hasShe;

  // other artists' full names present
  const others = new Set();
  for (const c of candidates) {
    if (c.id === a.id) continue;
    if (norm(c.name) === selfN) continue;
    if (selfN.includes(norm(c.name)) || norm(c.name).includes(selfN)) continue;
    if (nb.includes(c.n)) others.add(c.name);
  }
  const otherNames = [...others];

  // foreign geo cluster vs a VN-coded profile
  const cityCtx = norm([a.nationality, a.originCity, a.currentCity].filter(Boolean).join(' '));
  const isVN = /viet|ho chi minh|saigon|hanoi|ha noi/.test(cityCtx);
  const foreignHints = [...new Set(COUNTRY_HINTS.filter((h) => nb.includes(' ' + h)))];

  // known corrupt fragment
  const frag = CORRUPT_FRAGMENTS.filter((f) => nb.includes(f));

  const reasons = [];
  if (frag.length) reasons.push(`KNOWN-CORRUPT-FRAGMENT: "${frag.join('", "')}" (Aliansyah Caniago bio leak)`);
  if (!selfPresent) reasons.push(`OWN-NAME-ABSENT: bio never mentions "${a.name}"`);
  if (pronounSwitch) reasons.push('PRONOUN-SWITCH: bio uses both he/his and she/her');
  if (selfPresent && selfPosRatio > 0.5 && otherNames.length >= 1)
    reasons.push(`OWN-NAME-LATE: own name first appears ${Math.round(selfPosRatio * 100)}% into bio; opens describing other(s): ${otherNames.slice(0,4).join(', ')}`);
  if (isVN && foreignHints.length >= 2)
    reasons.push(`FOREIGN-GEO (VN profile): ${foreignHints.join(', ')}`);

  const isCorrupt =
    frag.length > 0 || !selfPresent || pronounSwitch ||
    (selfPresent && selfPosRatio > 0.5 && otherNames.length >= 1) ||
    (isVN && foreignHints.length >= 2);

  const rec = { slug: a.slug, name: a.name, reasons, others: otherNames,
    snippet: bio.replace(/\s+/g, ' ').slice(0, 240) };

  if (isCorrupt) corrupt.push(rec);
  else if (otherNames.length >= 3) {
    rec.reasons.push(`EVENT-BLURB?: bio lists ${otherNames.length} other artists (likely an event description, not a personal bio)`);
    eventBlurb.push(rec);
  } else if (otherNames.length >= 1) {
    rec.reasons.push(`mentions: ${otherNames.join(', ')}`);
    minor.push(rec);
  }
}

const withBio = active.filter((a) => a.bio && String(a.bio).trim()).length;
console.log(`Scanned ${active.length} active artist docs (${withBio} with bios).`);
console.log(`Roster cross-ref candidates: ${candidates.length}`);
console.log(`\n=== 🔴 LIKELY CORRUPTED (${corrupt.length}) ===\n`);
for (const r of corrupt) {
  console.log(`[${r.slug}] ${r.name}`);
  for (const x of r.reasons) console.log('   - ' + x);
  console.log('   » ' + r.snippet + '\n');
}
console.log(`\n=== 🟠 EVENT-BLURB / PLACEHOLDER BIOS (${eventBlurb.length}) — bio is an event roster, not a personal bio ===\n`);
for (const r of eventBlurb) console.log(`[${r.slug}] ${r.name} — lists: ${r.others.join(', ')}`);
console.log(`\n=== 🟡 MINOR (single incidental other-name mention) (${minor.length}) ===\n`);
for (const r of minor) console.log(`[${r.slug}] ${r.name} — ${r.others.join(', ')}`);
