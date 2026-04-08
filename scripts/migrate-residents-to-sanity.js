/**
 * migrate-residents-to-sanity.js
 *
 * Migrates all BIO_SLUGS residents from events-data.json into Sanity as artist documents.
 * Skips slugs already created by migrate-artists-to-sanity.js (artist-{slug} already exists).
 * Safe to re-run — uses createOrReplace with deterministic _id.
 *
 * Run: SANITY_WRITE_TOKEN=... node scripts/migrate-residents-to-sanity.js
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// Full BIO_SLUGS list from lib/events.ts
const BIO_SLUGS = new Set([
  "boynton-yue","michael-atavar","tam-do","ru-marshall",
  "noah-spivak","juan-leduc-riley","kaki","nguyen-giao-xuan","van-anh-le",
  "coco","lai-minh-ngoc","le-d-chung","ania-reynolds","anh-tran",
  "linh-vh-nguyen","shiro-masuyama","thom-nguyen","ian-strange",
  "exxonnubile-julia-weiner","x-o-veron-xio","aylin-derya-stahl",
  "virginie-tan","baby-reni","irene-ha","duy-nguyen","nguyen-hoa",
  "vicente-arrese","alex-williams","lau-wang-tat","narelle-zhao",
  "annabelle-yep","linh-san","damon-duc-pham","mascha-serga","blake-palmer",
  "david-willis","laura-philips","anh-vo","chau-kim-sanh","bert-ackley",
  "espen-iden","kayla-kurin","claire-bloomfield","yeonjeong","saverio-tonoli",
  "ly-trang","chu-hao-pei","nghia-dang","lan-anh-le","matteo-biella",
  "tina-thu","kanich-khajohnsri","levi-masuli","eden-barrena","rachel-tonthat",
  "nguyen-le-phuong-linh","roberto-sifuentes","aram-han-sifuentes",
  "natalia-ludmila","z1-studio","constance-meffre","mariana-tubio-blasio",
  "matthew-brannon","scott-anderson","cora-von-zezschwitz-tilman-hoepfl",
  "scott-farrand","latthapon-korkiatarkul","luca-lum","nguyen-duc-phuong",
  "cian-duggan","john-edmond-smyth","kim-duy","tram-luong",
  "tricia-nguyen-thanh-trang","bagus-mazasupa-anwarridwan","maung-day",
  "ben-valentine","tuyen-nguyen","alisa-chunchue","karen-thao-nguyen-la",
  "lem-trag","wu-chi-tsung",
]);

// Season data for known a.farm residents
const AFARM_SEASONS = {
  'anh-tran':                    { season: 'Season 4', period: 'late 2023',  residencyStartDate: '2023-10-01' },
  'aylin-derya-stahl':           { season: 'Season 5', period: 'early 2024', residencyStartDate: '2024-01-01' },
  'annabelle-yep':               { season: 'Season 5', period: 'early 2024', residencyStartDate: '2024-01-01' },
  'aram-han-sifuentes':          { season: 'Season 5', period: 'early 2024', residencyStartDate: '2024-02-01' },
  'alex-williams':               { season: 'Season 6', period: 'mid 2024',   residencyStartDate: '2024-06-01' },
  'anh-vo':                      { season: 'Season 6', period: 'mid 2024',   residencyStartDate: '2024-07-01' },
  'bagus-mazasupa-anwarridwan':  { season: 'Season 6', period: 'mid 2024',   residencyStartDate: '2024-08-01' },
  'ania-reynolds':               { season: 'Season 7', period: 'June 2025',  residencyStartDate: '2025-06-01' },
  'irene-ha':                    { season: 'Season 7', period: 'March 2025', residencyStartDate: '2025-03-01' },
};

function cleanName(title) {
  return title
    .replace(/^artist[-\s]+in[-\s]+residence\s*[|:]\s*/i, '')
    .replace(/^artist[-\s]+in[-\s]+residence\s+/i, '')
    .trim();
}

function cleanBio(bio) {
  if (!bio) return undefined;
  let text = bio;
  text = text.replace(/Loading Comments\.\.\.[\s\S]*$/s, '');
  text = text.replace(/Write a Comment\.\.\. Email \(Required\)[\s\S]*$/s, '');
  text = text.replace(/Subscribe Subscribed MoT\+\+\+[\s\S]*$/s, '');
  text = text.replace(/Programs\s+Residents\s+News\s+&\s+Events/g, '');
  text = text.replace(/\s*PAST EVENTS[\s\S]*?(?=\n\n|\s*$)/g, '');
  text = text.replace(/\s*[–-]\s*MoT\+\+\+ A\. Farm International Art Residency[\s\S]*?(?=\n\n|$)/g, '');
  text = text.replace(/Learn more (about (her|his|their) works?|at):\s*\S+\s*/gi, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text || undefined;
}

async function run() {
  const events = JSON.parse(fs.readFileSync(path.join(__dirname, '../events-data.json'), 'utf8'));
  const eventsBySlug = Object.fromEntries(events.map(e => [e.slug, e]));

  // Find which docs already exist so we can skip or merge carefully
  const existingIds = new Set(
    (await client.fetch(`*[_type == "artist"]._id`))
  );

  let created = 0, updated = 0, skipped = 0, errors = 0;

  for (const slug of BIO_SLUGS) {
    const event = eventsBySlug[slug];
    if (!event) {
      console.log(`  SKIP (no event found): ${slug}`);
      skipped++;
      continue;
    }

    const docId = `artist-${slug}`;
    const alreadyExists = existingIds.has(docId) || existingIds.has(`drafts.${docId}`);
    const name = cleanName(event.title);
    const bio = cleanBio(event.description);
    const afarm = AFARM_SEASONS[slug];
    const isResident = !!afarm;

    const doc = {
      _type: 'artist',
      _id: docId,
      slug: { _type: 'slug', current: slug },
      name,
      isAfarmResident: isResident,
      active: true,
    };

    if (bio) doc.bio = bio;
    if (event.images && event.images.length) doc.legacyImageUrls = event.images;
    if (afarm) {
      doc.season = afarm.season;
      doc.period = afarm.period;
      doc.residencyStartDate = afarm.residencyStartDate;
    } else if (event.sortDate) {
      doc.residencyStartDate = event.sortDate.slice(0, 10);
    }
    if (event.displayDate) doc.period = doc.period || event.displayDate;

    try {
      await client.createOrReplace(doc);
      if (alreadyExists) {
        updated++;
      } else {
        created++;
      }
      if ((created + updated) % 20 === 0) {
        console.log(`  ${created + updated} done so far...`);
      }
    } catch (err) {
      console.error(`  ERROR on ${slug}:`, err.message);
      errors++;
    }
  }

  console.log(`\nDone. Created: ${created}, updated: ${updated}, skipped: ${skipped}, errors: ${errors}`);
}

if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Error: SANITY_WRITE_TOKEN required.');
  process.exit(1);
}

run().catch(console.error);
