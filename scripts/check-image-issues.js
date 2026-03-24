#!/usr/bin/env node
// check-image-issues.js
// Analyzes events-data.json for image inconsistencies:
//   1. Cross-folder images (event using images from another event's R2 folder)
//   2. Duplicate filenames across events
//   3. Small events (1–3 images) that share filenames with larger events

const path = require('path');
const data = require(path.join(__dirname, '..', 'events-data.json'));

// ── Sets to skip ──────────────────────────────────────────────────────────────
const BIO_SLUGS = new Set([
  "boynton-yue","michael-atavar","tam-do","ru-marshall",
  "noah-spivak","juan-leduc-riley","kaki","nguyen-giao-xuan","van-anh-le",
  "coco","lai-minh-ngoc","le-d-chung","ania-reynolds","anh-tran",
  "linh-vh-nguyen","shiro-masuyama","thom-nguyen","ian-strange",
  "exxonnubile-julia-weiner","x-o-veron-xio","aylin-derya-stahl",
  "virginie-tan","irene-ha","duy-nguyen","nguyen-hoa",
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
  "lem-trag","wu-chi-tsung","weston-teruya",
  "mike-kilgore","chloe-sai-breil-dupont","tam-khoa-vu","nguyen-duc-hung",
  "li-ying-chen","beverly-tu","eliane-velozo",
  "artist-in-residence-ayumi-adachi","artist-in-residence-shayekh-mohammed-arif",
  "artist-in-residence-aliansyah-caniago","artist-in-residence-samira-jamouchi",
  "artist-in-residence-sikarnt-skoolisariyaporn","artist-in-residence-do-nguyen-lap-xuan",
  "artist-in-residence-xxavier-edward-carter","artist-in-residence-dang-thuy-anh",
  "artist-in-residence-flinh","artist-in-residence-masayuki-miyaji","artist-in-residence-zach-sch",
  "artist-in-residence-doan-thanh-toan","artist-in-residence-le-phuong-nhi","artist-in-residence-chung-nguyen",
  "cam-xanh","tuyp-tran","tran-minh-duc","bang-nhat-linh","dao-tung",
  "le-phi-long","tuan-mami","emmanuelle-huynh","celina-huynh","chinh-ba",
  "phung-tien-son","bo","nikola-h-mounoud","nhan-phan","yui-nguyen",
  "le-hien-minh","quoc-anh-le","fred-farrow","hang-nguyen","ly-hoang-ly",
  "le-quy-tong","thai-nhat-minh","pham-dinh-tien","ton-that-minh-nhat",
  "trinh-cam-nhi","tommy-mr-bambi","viet-luong","adam-goldstein","hoang-vu",
  "hoang-nam-viet","tran-quang-dai",
  "le-tuan-ry","marjana-janevska","keen-souhlal","maria-sowter","morag-mckee",
  "lyon-nguyen","pauline-payen","enkhbold-togmidshiirev","ha-ninh-pham",
  "tanya-amador","alexia-venot","quentin-spohn","elina-bry","uudam-tran-nguyen",
  "duong-tu-que",
]);

const HIDDEN_SLUGS = new Set([
  'self-funded-residency-program','linh-le','post-vidai','codesurfing',
  'talk-discussion-cung-tro-chuyen',
  'chuong-trinh-luu-tru-a-farm-duoc-tai-tro-danh-cho-nghe-si-viet-nam',
  'darren-mckenzie','felynn-ning-david-grey','griff-jurchak',
  'tuan-mami-cam-xanh-artist-presentations-performance-plus-2019',
  'the-calligraphic-regimes-of-contemporary-vietnamese-art-a-reading-discussion-with-pamela-n-corey',
  'thom-nguyen-exhibition-2025','nuoc-water-viet-2025',
  'while-the-soil-slumbers-linh-san-2024','krossing-over-arts-festival-2019',
  'a-farm-soft-opening','virginie-tan-aylin-derya-stahl-open-studio-2025',
  'open-studio-may-2025','duy-nguyen-open-studio-2025',
  'ru-marshall-performance-presentation-2025','gai-mac-do',
]);

const R2_BASE = 'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/events/';

// ── Filter to event-only entries with images ──────────────────────────────────
const events = data.filter(e =>
  !BIO_SLUGS.has(e.slug) &&
  !HIDDEN_SLUGS.has(e.slug) &&
  !e.slug.endsWith('-vn') &&
  e.images && e.images.length > 0
);

console.log(`\nAnalyzing ${events.length} events (bio/hidden/vn slugs excluded)...\n`);
console.log('═'.repeat(70));

// ── ISSUE 1: Cross-folder images ──────────────────────────────────────────────
console.log('\n[ISSUE 1] CROSS-FOLDER IMAGES');
console.log('  Events that use images stored in a different event\'s R2 folder.');
console.log('─'.repeat(70));

const crossFolderIssues = [];

for (const event of events) {
  const badImages = [];

  for (const imgUrl of event.images) {
    if (!imgUrl.startsWith(R2_BASE)) continue; // skip non-R2 or other buckets

    const withoutBase = imgUrl.slice(R2_BASE.length); // e.g. "some-other-event/file.jpg"
    const slashIdx = withoutBase.indexOf('/');
    if (slashIdx === -1) continue;

    const folder = withoutBase.slice(0, slashIdx);
    if (folder !== event.slug) {
      badImages.push({ url: imgUrl, folder });
    }
  }

  if (badImages.length > 0) {
    crossFolderIssues.push({ event, badImages });
  }
}

if (crossFolderIssues.length === 0) {
  console.log('  None found.\n');
} else {
  for (const { event, badImages } of crossFolderIssues) {
    console.log(`\n  Event: ${event.slug}  (${event.images.length} total images)`);
    console.log(`  Title: ${event.title}`);
    const byFolder = {};
    for (const b of badImages) {
      if (!byFolder[b.folder]) byFolder[b.folder] = [];
      byFolder[b.folder].push(b.url.split('/').pop());
    }
    for (const [folder, files] of Object.entries(byFolder)) {
      console.log(`    ↳ from folder "${folder}": ${files.join(', ')}`);
    }
  }
  console.log('');
}

// ── ISSUE 2: Duplicate filenames across events ────────────────────────────────
console.log('\n[ISSUE 2] DUPLICATE FILENAMES ACROSS EVENTS');
console.log('  The same image filename appears in multiple distinct events.');
console.log('─'.repeat(70));

// Build map: filename → list of event slugs that use it
// Only count filenames that look meaningful (not generic names like "image.jpg")
const genericNames = new Set([
  'image.jpg','img.jpg','photo.jpg','pic.jpg',
  'fb-event.jpg','fb-event.png','facebook.jpg',
  'poster.jpg','poster.png','flyer.jpg','flyer.png',
  'thumbnail.jpg','thumb.jpg','cover.jpg','cover.png',
  'banner.jpg','banner.png',
  'img_0001.jpg','img_0002.jpg',
  'untitled.jpg','untitled.png',
]);

const filenameToEvents = new Map(); // filename → Set of slugs

for (const event of events) {
  for (const imgUrl of event.images) {
    const filename = imgUrl.split('/').pop().toLowerCase();
    if (!filename) continue;
    if (genericNames.has(filename)) continue;

    if (!filenameToEvents.has(filename)) {
      filenameToEvents.set(filename, new Set());
    }
    filenameToEvents.get(filename).add(event.slug);
  }
}

const duplicateFilenames = [...filenameToEvents.entries()]
  .filter(([, slugSet]) => slugSet.size > 1)
  .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));

if (duplicateFilenames.length === 0) {
  console.log('  None found.\n');
} else {
  // Group by the sets of events to avoid verbose per-file listing
  // Show each filename and the events it appears in
  for (const [filename, slugSet] of duplicateFilenames) {
    const slugList = [...slugSet].sort();
    console.log(`\n  File: ${filename}  (appears in ${slugSet.size} events)`);
    slugList.forEach(s => console.log(`    • ${s}`));
  }
  console.log('');
}

// ── ISSUE 3: Small events sharing filenames with larger events ────────────────
console.log('\n[ISSUE 3] SMALL EVENTS (1–3 images) SHARING FILENAMES WITH LARGER EVENTS');
console.log('  Potential partial duplicates / misattributed subsets.');
console.log('─'.repeat(70));

const smallEvents = events.filter(e => e.images.length >= 1 && e.images.length <= 3);
const largeEvents = events.filter(e => e.images.length > 3);

// Build filename → large-event map
const filenameToLargeEvents = new Map();
for (const event of largeEvents) {
  for (const imgUrl of event.images) {
    const filename = imgUrl.split('/').pop().toLowerCase();
    if (!filename || genericNames.has(filename)) continue;
    if (!filenameToLargeEvents.has(filename)) {
      filenameToLargeEvents.set(filename, new Set());
    }
    filenameToLargeEvents.get(filename).add(event.slug);
  }
}

const smallEventMatches = [];
for (const small of smallEvents) {
  const overlappingLargeEvents = new Set();
  const matchedFiles = [];
  for (const imgUrl of small.images) {
    const filename = imgUrl.split('/').pop().toLowerCase();
    if (!filename || genericNames.has(filename)) continue;
    const largeMatches = filenameToLargeEvents.get(filename);
    if (largeMatches) {
      matchedFiles.push(filename);
      for (const s of largeMatches) overlappingLargeEvents.add(s);
    }
  }
  if (overlappingLargeEvents.size > 0) {
    smallEventMatches.push({ small, overlappingLargeEvents, matchedFiles });
  }
}

if (smallEventMatches.length === 0) {
  console.log('  None found.\n');
} else {
  for (const { small, overlappingLargeEvents, matchedFiles } of smallEventMatches) {
    console.log(`\n  Small event: ${small.slug}  (${small.images.length} image${small.images.length > 1 ? 's' : ''})`);
    console.log(`  Title: ${small.title}`);
    console.log(`  Shared file(s): ${matchedFiles.join(', ')}`);
    console.log(`  Overlaps with:`);
    for (const s of [...overlappingLargeEvents].sort()) {
      const e = events.find(ev => ev.slug === s);
      console.log(`    • ${s}  (${e ? e.images.length : '?'} images)`);
    }
  }
  console.log('');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('═'.repeat(70));
console.log('\nSUMMARY');
console.log(`  Cross-folder image issues:              ${crossFolderIssues.length} event(s)`);
console.log(`  Filenames shared across multiple events: ${duplicateFilenames.length} filename(s)`);
console.log(`  Small events sharing files with larger:  ${smallEventMatches.length} event(s)`);
console.log('');
