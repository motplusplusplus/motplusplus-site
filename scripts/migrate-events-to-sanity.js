/**
 * migrate-events-to-sanity.js
 *
 * Imports all events from events-data.json into Sanity.
 * Run once: node scripts/migrate-events-to-sanity.js
 *
 * Safe to re-run — uses createOrReplace with deterministic _id.
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN, // set this env var before running
  useCdn: false,
});

// Slugs that are resident bio pages, not public event listings
const BIO_SLUGS = new Set([
  "boynton-yue","michael-atavar","tam-do","ru-marshall",
  "noah-spivak","juan-leduc-riley","kaki","nguyen-giao-xuan","van-anh-le",
  "coco","lai-minh-ngoc","le-d-chung","ania-reynolds","anh-tran",
  "linh-vh-nguyen","shiro-masuyama","thom-nguyen","ian-strange",
  "exxonnubile-julia-weiner","x-o-veron-xio","aylin-derya-stahl",
  "virginie-tan","irene-ha","duy-nguyen","nguyen-hoa",
  "vicente-arresse","alex-williams","lau-wang-tat","narelle-zhao",
  "annabelle-yep","linh-san","damon-duc-pham","mascha-serga","blake-palmer",
  "david-willis","laura-philips","bert-ackley","espen-iden","cam-xanh",
  "mike-kilgore","chloe-sai-breil-dupont","tam-khoa-vu","nguyen-duc-hung",
  "marjana-janevska","nikola-h-mounoud","pauline-payen","celina-huynh",
  "darren-mckenzie","griff-jurchak",
]);

// VN mirror slugs (duplicates of English posts)
const isVnMirror = (slug) => slug.endsWith('-vn') || [
  'cho-ngay-doan-tuyet-celina-huynh',
  'loi-moi-ung-tuyen-choi-voi-feedback-workshop-xay-dung-am-thanh-cung-nikola-h-mounoud',
  'chuong-trinh-luu-tru-a-farm-duoc-tai-tro-danh-cho-nghe-si-viet-nam',
].includes(slug);

async function run() {
  const eventsPath = path.join(__dirname, '../events-data.json');
  const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

  console.log(`Migrating ${events.length} events to Sanity...`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    const slugValue = event.slug;

    // Skip VN mirrors — they're duplicates
    if (isVnMirror(slugValue)) {
      skipped++;
      continue;
    }

    const doc = {
      _type: 'event',
      _id: `event-${slugValue}`,
      slug: { _type: 'slug', current: slugValue },
      title: event.title || '',
      vnTitle: event.vnTitle || undefined,
      dateISO: event.dateISO || event.sortDate || undefined,
      endDateISO: event.endDateISO || undefined,
      displayDate: event.displayDate || '',
      category: event.category || '',
      location: event.location || '',
      description: event.description || '',
      vnDescription: event.vnDescription || '',
      legacyImageUrls: (event.images || []).filter(Boolean),
      uploadedImages: [],
      videoUrl: event.videoUrl || undefined,
      bandcampAlbumId: event.bandcampAlbumId || undefined,
      wpLink: event.wpLink || undefined,
      active: true,
      isBioPage: BIO_SLUGS.has(slugValue),
    };

    // Remove undefined fields
    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);

    try {
      await client.createOrReplace(doc);
      created++;
      if (created % 50 === 0) console.log(`  ${created} / ${events.length - skipped} done...`);
    } catch (err) {
      console.error(`  ERROR on ${slugValue}:`, err.message);
      errors++;
    }
  }

  console.log(`\nDone. Created/updated: ${created}, skipped (VN mirrors): ${skipped}, errors: ${errors}`);
}

if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('Error: SANITY_WRITE_TOKEN environment variable is required.');
  console.error('Get a write token from https://sanity.io/manage → project → API → Tokens');
  process.exit(1);
}

run().catch(console.error);
