/**
 * migrate-artists-to-sanity.js
 *
 * Imports artists from artists-data.json into Sanity, extracting structured
 * fields (birthYear, nationality, originCity, currentCity) from existing
 * origin strings and bio text. Cleans WP cruft from bios.
 *
 * Run once: node scripts/migrate-artists-to-sanity.js
 * Safe to re-run — uses createOrReplace with deterministic _id.
 *
 * Pass --dry-run to preview without writing to Sanity.
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// ─── Slugs to skip (WP "artist-in-residence-*" duplicates or known bad entries) ─
const SKIP_SLUGS = new Set([
  'artist-in-residence-aliansyah-caniago',
  'artist-in-residence-ayumi-adachi',
  'artist-in-residence-ben-valentine', // if exists
]);

// ─── Known A.Farm residents (from AFARM_RESIDENT_SLUGS in lib/events.ts) ─────
// These map slug → { season, period, residencyStartDate }
// Partial — editors can fill in the rest in Sanity Studio
const AFARM_SEASONS = {
  'anh-tran': { season: 'Season 4', period: 'late 2023', residencyStartDate: '2023-10-01' },
  'aylin-derya-stahl': { season: 'Season 5', period: 'early 2024', residencyStartDate: '2024-01-01' },
  'annabelle-yep': { season: 'Season 5', period: 'early 2024', residencyStartDate: '2024-01-01' },
  'aram-han-sifuentes': { season: 'Season 5', period: 'early 2024', residencyStartDate: '2024-02-01' },
  'alex-williams': { season: 'Season 6', period: 'mid 2024', residencyStartDate: '2024-06-01' },
  'anh-vo': { season: 'Season 6', period: 'mid 2024', residencyStartDate: '2024-07-01' },
  'bagus-mazasupa-anwarridwan': { season: 'Season 6', period: 'mid 2024', residencyStartDate: '2024-08-01' },
  'ania-reynolds': { season: 'Season 7', period: 'June 2025', residencyStartDate: '2025-06-01' },
  'irene-ha': { season: 'Season 7', period: 'March 2025', residencyStartDate: '2025-03-01' },
};

// ─── Extract birth year ────────────────────────────────────────────────────────
function extractBirthYear(origin, bio) {
  // origin field: "Indonesia, b. 1987" or "b.1990"
  const originMatch = origin && origin.match(/\bb\.?\s*(\d{4})\b/);
  if (originMatch) return parseInt(originMatch[1]);

  // bio: "(b.1997)", "(b. 1989", "born 1989", "was born in 1987"
  const bioPatterns = [
    /\(b[.\s]+(\d{4})[,)]/,
    /\bborn\s+(\d{4})\b/i,
    /\bwas born in (\d{4})\b/i,
    /born in \d{4} in [^,]+,\s*(\w+)/i, // "born in 1987 in Tangerang, Indonesia"
  ];
  if (bio) {
    for (const pat of bioPatterns) {
      const m = bio.match(pat);
      if (m) return parseInt(m[1]);
    }
  }
  return undefined;
}

// ─── Extract nationality from origin field ────────────────────────────────────
function extractNationality(origin) {
  if (!origin) return undefined;
  // "Indonesia, b. 1987" → "Indonesia"
  // "b. 1990" → undefined
  const clean = origin.replace(/,?\s*b\.?\s*\d{4}/, '').trim();
  return clean || undefined;
}

// ─── Extract origin/current city from bio ─────────────────────────────────────
function extractCities(bio) {
  if (!bio) return {};
  const result = {};

  // "(b. 1989, Bến Tre, Vietnam)" → originCity: "Bến Tre"
  const birthCityMatch = bio.match(/\(b[.\s]+\d{4},\s*([^,)]+),\s*([^)]+)\)/);
  if (birthCityMatch) {
    result.originCity = birthCityMatch[1].trim();
  }

  // "based in Ho Chi Minh City" / "based in Brooklyn, NY" / "based in Berlin"
  const basedMatch = bio.match(/\bbased in ([A-Z][^,.]+(?:,\s*[A-Z][^,.]+)?)/);
  if (basedMatch) {
    result.currentCity = basedMatch[1].trim().replace(/\.$/, '');
  }

  // "hailing from X" → originCity if not already set
  if (!result.originCity) {
    const hailingMatch = bio.match(/\bhailing from ([A-Z][^,.]+(?:,\s*[A-Z][^,.]+)?)/);
    if (hailingMatch) {
      result.originCity = hailingMatch[1].trim();
    }
  }

  return result;
}

// ─── Clean bio text ────────────────────────────────────────────────────────────
function cleanBio(bio, artistName) {
  if (!bio) return undefined;

  let text = bio;

  // Remove HTML class garbage at start (WP export artifact)
  text = text.replace(/^entry-content[^"]*"?[>]?\s*/i, '');
  text = text.replace(/^[a-z-]+-layout-[^\n]+\n/gm, '');

  // Remove WP footer cruft
  const cruftPatterns = [
    /Loading Comments\.\.\..*$/s,
    /Write a Comment\.\.\. Email \(Required\).*$/s,
    /Subscribe Subscribed MoT\+\+\+.*$/s,
    /Contact Us a\.farm\.saigon@gmail\.com.*$/s,
    /Comment Subscribe Subscribed.*$/s,
    /Sign me up Already have a WordPress.*$/s,
  ];
  for (const pat of cruftPatterns) {
    text = text.replace(pat, '');
  }

  // Remove "PAST EVENTS ..." sections (WP sidebar cruft appended to bios)
  text = text.replace(/\s*PAST EVENTS\s[\s\S]*?(?=\n\n|\s*$)/g, '');

  // Remove "Residents News & Events [name] [repeated bio]" — deduplicate
  // Detect if bio is roughly repeated: split in half and check similarity
  const mid = Math.floor(text.length / 2);
  const firstHalf = text.slice(0, mid).trim();
  const secondHalf = text.slice(mid).trim();
  // If the second half starts with content very similar to the first 100 chars
  if (
    firstHalf.length > 200 &&
    secondHalf.length > 200 &&
    secondHalf.slice(0, 80).replace(/\s+/g, ' ') === firstHalf.slice(0, 80).replace(/\s+/g, ' ')
  ) {
    text = firstHalf;
  }

  // Remove "– MoT+++ A. Farm International Art Residency..." boilerplate
  text = text.replace(/\s*[–-]\s*MoT\+\+\+ A\. Farm International Art Residency[\s\S]*?(?=\n\n|$)/g, '');

  // Remove "a Saigon-based art residency, in partnership with..." boilerplate
  text = text.replace(/a Saigon-based art residency,.*?(?=\n\n|$)/gs, '');

  // Remove "Learn more about (her|their|his) works?:" + URL
  text = text.replace(/Learn more about (her|his|their) works?:\s*\S+\s*/gi, '');

  // Remove "Learn more at: URL"
  text = text.replace(/Learn more at:\s*\S+\s*/gi, '');

  // Remove artist name + " – MoT+++" header lines
  if (artistName) {
    const escapedName = artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    text = text.replace(new RegExp(`${escapedName}\\s*[–-]\\s*MoT\\+\\+\\+[^\\n]*\\n?`, 'g'), '');
    // Remove orphaned artist name lines that are just the name repeated
    text = text.replace(new RegExp(`^${escapedName}\\s*$`, 'gm'), '');
  }

  // Remove "Programs Residents News & Events" navigation cruft
  text = text.replace(/Programs\s+Residents\s+News\s+&\s+Events/g, '');

  // Remove "This residency was supported in part by..." (optional — keep as is, it's legit)
  // Actually keep this, it's real content.

  // Normalize whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text || undefined;
}

// ─── Extract links from website field ─────────────────────────────────────────
function buildLinks(website) {
  if (!website) return [];
  // Ensure URL has protocol
  let url = website.trim();
  if (url && !url.startsWith('http')) url = 'https://' + url;
  return [{ label: 'Website', url }];
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const dataPath = path.join(__dirname, '../artists-data.json');
  const artists = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`Processing ${artists.length} artist entries...`);

  // Deduplicate: prefer entries without "artist-in-residence-" prefix
  // and prefer entries with more data (photo, bio quality)
  const seen = new Map(); // name.toLowerCase() → best entry
  for (const a of artists) {
    if (SKIP_SLUGS.has(a.slug)) continue;
    const key = a.name.toLowerCase().trim();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, a);
    } else {
      // Prefer the one with a photo, or the one with resident=true, or collective=true
      const score = (x) => (x.photo ? 2 : 0) + (x.resident ? 1 : 0) + (x.collective ? 1 : 0);
      if (score(a) > score(existing)) seen.set(key, a);
    }
  }

  const deduped = [...seen.values()];
  console.log(`After dedup: ${deduped.length} unique artists\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const a of deduped) {
    const slug = a.slug;
    const bio = cleanBio(a.bio, a.name);
    const birthYear = extractBirthYear(a.origin || '', bio || a.bio || '');
    const nationality = extractNationality(a.origin || '');
    const { originCity, currentCity } = extractCities(bio || a.bio || '');
    const afarm = AFARM_SEASONS[slug];
    const links = buildLinks(a.website);

    const doc = {
      _type: 'artist',
      _id: `artist-${slug}`,
      slug: { _type: 'slug', current: slug },
      name: a.name,
      isAfarmResident: !!(a.resident || afarm),
      active: true,
    };

    if (bio) doc.bio = bio;
    if (birthYear) doc.birthYear = birthYear;
    if (nationality) doc.nationality = nationality;
    if (originCity) doc.originCity = originCity;
    if (currentCity) doc.currentCity = currentCity;
    if (a.instagram) doc.instagram = a.instagram;
    if (links.length) doc.links = links;
    if (a.photo) doc.legacyImageUrls = [a.photo];
    if (a.workImages && a.workImages.length) {
      doc.legacyImageUrls = [
        ...(doc.legacyImageUrls || []),
        ...a.workImages,
      ];
    }

    // A.Farm season data
    if (afarm) {
      doc.season = afarm.season;
      doc.period = afarm.period;
      doc.residencyStartDate = afarm.residencyStartDate;
    }

    if (DRY_RUN) {
      console.log(`[DRY RUN] ${a.name} (${slug})`);
      if (birthYear) console.log(`  birthYear: ${birthYear}`);
      if (nationality) console.log(`  nationality: ${nationality}`);
      if (originCity) console.log(`  originCity: ${originCity}`);
      if (currentCity) console.log(`  currentCity: ${currentCity}`);
      if (afarm) console.log(`  afarm: ${afarm.season} / ${afarm.period}`);
      if (links.length) console.log(`  links: ${links.map(l => l.url).join(', ')}`);
      console.log('');
      created++;
      continue;
    }

    try {
      await client.createOrReplace(doc);
      created++;
      if (created % 20 === 0) console.log(`  ${created} / ${deduped.length} done...`);
    } catch (err) {
      console.error(`  ERROR on ${slug}:`, err.message);
      errors++;
    }
  }

  console.log(`\nDone. Created/updated: ${created}, skipped: ${skipped}, errors: ${errors}`);
}

if (!DRY_RUN && !process.env.SANITY_WRITE_TOKEN) {
  console.error('Error: SANITY_WRITE_TOKEN environment variable is required.');
  console.error('Get a write token from https://sanity.io/manage → project → API → Tokens');
  console.error('\nOr run with --dry-run to preview without writing.');
  process.exit(1);
}

run().catch(console.error);
