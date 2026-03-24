/**
 * create-trash-sanity-docs.js
 *
 * Creates Sanity `trashItem` documents for +1 Trash works, and `artist`
 * documents for Nguyen Huy An and Truong Tan.
 *
 * Reads R2 image URLs from scripts/trash-image-urls.json (output of
 * upload-trash-images.py). If that file doesn't exist, runs without images.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=<token> node scripts/create-trash-sanity-docs.js
 *   SANITY_WRITE_TOKEN=<token> node scripts/create-trash-sanity-docs.js --dry-run
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('ERROR: SANITY_WRITE_TOKEN env var is not set.');
  console.error('Run with: SANITY_WRITE_TOKEN=<token> node scripts/create-trash-sanity-docs.js');
  process.exit(1);
}

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// ── Load image URLs ───────────────────────────────────────────────────────────
const urlsPath = path.join(__dirname, 'trash-image-urls.json');
let imageUrls = {};
if (fs.existsSync(urlsPath)) {
  imageUrls = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));
  console.log(`Loaded ${Object.keys(imageUrls).length} image URLs from trash-image-urls.json`);
} else {
  console.warn('Warning: trash-image-urls.json not found — creating documents without images.');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a Sanity image array from a list of artist-slug/filename keys.
 * Each item becomes a {_type:'image', url:...} reference-style object.
 * We use the external URL approach since we're not uploading assets to Sanity.
 */
function imageRefs(keys) {
  return keys
    .map(k => imageUrls[k])
    .filter(Boolean)
    .map(url => ({
      _type: 'imageUrl',
      url,
    }));
}

/**
 * Build Sanity image array using a prefix + numbered filenames.
 */
function imageRange(artistSlug, filenamePrefix, count, startAt = 1) {
  const keys = [];
  for (let i = startAt; i < startAt + count; i++) {
    const n = String(i).padStart(2, '0');
    keys.push(`${artistSlug}/${filenamePrefix}-${n}.jpg`);
  }
  return imageRefs(keys);
}

// ── Trash Item documents ──────────────────────────────────────────────────────

// Kim Duy — Field of Shredded Paper images
const fieldShredImages = imageRefs([
  'kim-duy/field-of-shredded-paper-01.jpg',
  'kim-duy/field-of-shredded-paper-02.jpg',
  'kim-duy/field-of-shredded-paper-details.jpg',
]);

// Kim Duy — Text images (all 8)
const textImages = imageRefs([
  'kim-duy/text-01.jpg',
  'kim-duy/text-02.jpg',
  'kim-duy/text-03.jpg',
  'kim-duy/text-04.jpg',
  'kim-duy/text-05.jpg',
  'kim-duy/text-06.jpg',
  'kim-duy/text-07.jpg',
  'kim-duy/text-08.jpg',
]);

// Wu Chi Tsung images
const cyanoImages = imageRefs([
  'wu-chi-tsung/cyano-collage-065-01.jpg',
  'wu-chi-tsung/cyano-collage-065-02.jpg',
]);
const wireVImages = imageRefs([
  'wu-chi-tsung/wire-v-01.jpg',
  'wu-chi-tsung/wire-v-02.jpg',
]);

// Phi Long Le images
const phiAllImages = imageRefs([
  'phi-long-le/hunting-01.jpg',
  'phi-long-le/hunting-02.jpg',
  'phi-long-le/hunting-03.jpg',
  'phi-long-le/hunting-04.jpg',
  'phi-long-le/hunting-05.jpg',
]);

// Truong Tan images (all 10 — all >= 400px wide)
const truongImages = imageRefs([
  'truong-tan/untitled-000.jpg',
  'truong-tan/untitled-001.jpg',
  'truong-tan/untitled-002.jpg',
  'truong-tan/untitled-003.jpg',
  'truong-tan/untitled-004.jpg',
  'truong-tan/untitled-005.jpg',
  'truong-tan/untitled-006.jpg',
  'truong-tan/untitled-007.jpg',
  'truong-tan/untitled-008.jpg',
  'truong-tan/untitled-009.jpg',
]);

// Aliansyah
const aliansyahImages = imageRefs([
  'aliansyah-caniago/hunters-and-gatherers-vol1.jpg',
]);

// Cam Xanh — FIO
const fioImages = imageRefs([
  'cam-xanh/fio-f-for-freedom.jpg',
  'cam-xanh/fio-i-in-independence.jpg',
  'cam-xanh/fio-o-off-orgasm.jpg',
  'cam-xanh/fio-silk-cocoons-01.jpg',
  'cam-xanh/fio-silk-cocoons-02.jpg',
]);

// Phuong Linh
const phuongLinhImages = imageRefs([
  'phuong-linh/cao-xa-la-00.jpg',
  'phuong-linh/cao-xa-la-01.jpg',
  'phuong-linh/cao-xa-la-02.jpg',
  'phuong-linh/cao-xa-la-s2.jpg',
  'phuong-linh/cao-xa-la-gq.jpg',
]);

// Bang Nhat Linh
const bangImages = imageRefs([
  'bang-nhat-linh/vacant-chair-01.jpg',
  'bang-nhat-linh/vacant-chair-02.jpg',
  'bang-nhat-linh/vacant-chair-03.jpg',
]);

// ── Document definitions ──────────────────────────────────────────────────────

const trashItems = [
  // 1. Kim Duy — Fields of Shredded Paper ed. 1
  {
    _id: 'trash-kim-duy-fields-shredded-paper-ed1',
    _type: 'trashItem',
    artist: 'Kim Duy',
    title: 'Fields of Shredded Paper',
    year: 2017,
    medium: '2000+ found photographs of the Vietnam War, printed on paper and immediately shredded',
    dimensions: 'variable',
    edition: '1/5 + 1 AP',
    description: 'Over three weeks, 2000+ found photographs of the Vietnam War from the internet were printed and shredded immediately. The physical photographs exist only for a fleeting moment, still damp with ink, within a repeated process of view–print–shred. What remains is strewn throughout the exhibition floor — the remains of violent historical events begin to look strikingly similar to one another, each shredded piece acting as part of a whole, blurring past and present into a symbolic, unsolvable puzzle of disremembering.',
    sold: true,
    soldTo: 'Daniel Howald, Conches, Switzerland',
    soldPrice: '5,460 USD (patron price; list price 7,800 USD)',
    soldDate: 'April 2019',
    provenanceNotes: 'Certificate of Origin issued April 2019. Invoice issued by MoT+++, Saigon Domaine.',
    price: 'sold',
    active: true,
    images: fieldShredImages,
  },

  // 2. Kim Duy — Fields of Shredded Paper ed. 2
  {
    _id: 'trash-kim-duy-fields-shredded-paper-ed2',
    _type: 'trashItem',
    artist: 'Kim Duy',
    title: 'Fields of Shredded Paper',
    year: 2017,
    medium: '2000+ found photographs of the Vietnam War, printed on paper and immediately shredded',
    dimensions: 'variable',
    edition: '2/5 + 1 AP',
    description: 'Over three weeks, 2000+ found photographs of the Vietnam War from the internet were printed and shredded immediately. The physical photographs exist only for a fleeting moment, still damp with ink, within a repeated process of view–print–shred. What remains is strewn throughout the exhibition floor — the remains of violent historical events begin to look strikingly similar to one another, each shredded piece acting as part of a whole, blurring past and present into a symbolic, unsolvable puzzle of disremembering.',
    sold: true,
    soldTo: 'Daniel Howald, Conches, Switzerland',
    soldPrice: '5,460 USD (patron price; list price 7,800 USD)',
    soldDate: 'September 2019',
    provenanceNotes: 'Certificate of Origin issued September 2019. Invoice issued by MoT+++, Saigon Domaine.',
    price: 'sold',
    active: true,
    images: fieldShredImages,
  },

  // 3. Kim Duy — Text copy 2
  {
    _id: 'trash-kim-duy-text-copy2',
    _type: 'trashItem',
    artist: 'Kim Duy',
    title: 'Text',
    year: 2018,
    medium: 'pen on tracing paper',
    dimensions: '19 pages, 210 × 297 mm each',
    edition: 'copy 2 (edition of 5 + 1 AP)',
    description: "Pen on tracing paper, 19 pages. Text appears regularly in Kim Duy's artworks as an allegory for the way information is transmuted through an individual's subjectivity and the passing of time.",
    sold: true,
    soldTo: 'Nguyen Art Foundation',
    soldPrice: '3,500 USD',
    soldDate: 'December 2018',
    price: 'sold',
    active: true,
    images: textImages,
  },

  // 4. Kim Duy — Untitled (untitled)
  {
    _id: 'trash-kim-duy-untitled',
    _type: 'trashItem',
    artist: 'Kim Duy',
    title: 'Untitled (untitled)',
    year: 2016,
    medium: 'C-print',
    dimensions: '297 × 420 mm',
    edition: 'edition of 5/20',
    sold: false,
    price: 'on request',
    active: true,
    images: imageRefs(['kim-duy/untitled-untitled.jpg']),
  },

  // 5. Wu Chi Tsung — Wire V
  {
    _id: 'trash-wu-chi-tsung-wire-v',
    _type: 'trashItem',
    artist: 'Wu Chi Tsung',
    title: 'Wire V',
    year: 2018,
    medium: 'metal, glass, motor',
    dimensions: 'variable',
    edition: '2/5 + 2 AP',
    description: "Wire V is part of Wu Chi Tsung's ongoing investigation into the paradoxical nature of order and chaos, structure and dissolution. The motorised metal and glass construction shifts and evolves, embodying the tension between control and entropy.",
    sold: true,
    soldTo: 'Daniel Howald, Conches, Switzerland',
    soldPrice: '17,500 USD (patron price)',
    soldDate: 'September 2019',
    provenanceNotes: 'Invoice issued by MoT+++, September 16, 2019.',
    price: 'sold',
    active: true,
    images: wireVImages,
  },

  // 6. Wu Chi Tsung — Cyano-Collage 065
  {
    _id: 'trash-wu-chi-tsung-cyano-collage-065',
    _type: 'trashItem',
    artist: 'Wu Chi Tsung',
    title: 'Cyano-Collage 065',
    year: 2019,
    medium: 'cyanotype photography, Xuan papers, acrylic gel',
    dimensions: '70 × 135 cm',
    edition: 'unique',
    description: "Wu Chi Tsung's Cyano-Collage series uses cyanotype photography — an early photographic process — combined with traditional Xuan paper and acrylic gel. The works explore the intersection of photographic chemistry, material tradition, and time.",
    sold: true,
    soldTo: 'Daniel Howald, Conches, Switzerland',
    soldPrice: '10,500 USD (patron price)',
    soldDate: 'September 2019',
    provenanceNotes: 'Invoice issued by MoT+++, September 16, 2019.',
    price: 'sold',
    active: true,
    images: cyanoImages,
  },

  // 7. Wu Chi Tsung — Still Life 008 – Pearl Bush (no images — video work)
  {
    _id: 'trash-wu-chi-tsung-still-life-008',
    _type: 'trashItem',
    artist: 'Wu Chi Tsung',
    title: 'Still Life 008 – Pearl Bush',
    year: 2018,
    medium: 'Full HD video, single channel',
    dimensions: '1920 × 1080 px, 15:43 duration',
    edition: '1/5 + 2 AP',
    description: "Part of Wu Chi Tsung's Still Life series, this single-channel video work reimagines traditional Chinese painting through the lens of contemporary digital technology, observing a Pearl Bush in meticulous, contemplative detail.",
    sold: true,
    soldTo: 'Ta Thi Le Hoan',
    soldPrice: '8,000 USD',
    soldDate: 'September 2019',
    provenanceNotes: 'Invoice issued by MoT+++, September 16, 2019.',
    price: 'sold',
    active: true,
  },

  // 8. Phi Long Le — Hunting as a Metaphor for Politics (full installation)
  {
    _id: 'trash-phi-long-le-hunting-installation',
    _type: 'trashItem',
    artist: 'Le Phi Long',
    title: 'Hunting as a Metaphor for Politics (installation of 29 works)',
    year: 2017,
    medium: 'ink & golden leaf on Dzo paper, framed',
    dimensions: '110 × 158 cm each',
    edition: 'unique',
    description: "An installation of 29 works on Dzo paper using ink and golden leaf. Phi Long Le's practice draws on Vietnamese historical imagery, myth, and visual tradition, reinterpreted through the language of contemporary painting.",
    sold: false,
    price: '25,000 USD (full installation)',
    active: true,
    images: phiAllImages,
  },

  // 9. Phi Long Le — Hunting #01
  {
    _id: 'trash-phi-long-le-hunting-01',
    _type: 'trashItem',
    artist: 'Le Phi Long',
    title: 'Hunting as a Metaphor for Politics #01',
    year: 2017,
    medium: 'ink & golden leaf on Dzo paper',
    dimensions: '110 × 236 cm',
    edition: 'unique',
    sold: false,
    price: '5,200 USD',
    active: true,
    images: imageRefs(['phi-long-le/hunting-01.jpg']),
  },

  // 10. Phi Long Le — Hunting #02
  {
    _id: 'trash-phi-long-le-hunting-02',
    _type: 'trashItem',
    artist: 'Le Phi Long',
    title: 'Hunting as a Metaphor for Politics #02',
    year: 2017,
    medium: 'ink & golden leaf on Dzo paper',
    dimensions: '60 × 75 cm',
    edition: 'unique',
    sold: false,
    price: '1,800 USD',
    active: true,
    images: imageRefs(['phi-long-le/hunting-02.jpg']),
  },

  // 11. Phi Long Le — Hunting #03
  {
    _id: 'trash-phi-long-le-hunting-03',
    _type: 'trashItem',
    artist: 'Le Phi Long',
    title: 'Hunting as a Metaphor for Politics #03',
    year: 2017,
    medium: 'ink & golden leaf on Dzo paper',
    dimensions: '220 × 240 cm',
    edition: 'unique',
    sold: false,
    price: '7,200 USD',
    active: true,
    images: imageRefs(['phi-long-le/hunting-03.jpg']),
  },

  // 12. Phi Long Le — Hunting #04
  {
    _id: 'trash-phi-long-le-hunting-04',
    _type: 'trashItem',
    artist: 'Le Phi Long',
    title: 'Hunting as a Metaphor for Politics #04',
    year: 2017,
    medium: 'ink & golden leaf on Dzo paper',
    dimensions: '110 × 158 cm',
    edition: 'unique',
    sold: false,
    price: '3,200 USD',
    active: true,
    images: imageRefs(['phi-long-le/hunting-04.jpg']),
  },

  // 13. Phi Long Le — Mark no.5
  {
    _id: 'trash-phi-long-le-mark-5',
    _type: 'trashItem',
    artist: 'Le Phi Long',
    title: 'Mark no.5',
    year: 2021,
    medium: 'ink & gold leaves on Dzo paper',
    dimensions: '135 × 105 cm',
    edition: 'unique',
    sold: true,
    soldTo: 'Ms Abha Nanda',
    soldDate: '2021',
    provenanceNotes: 'Certificate of Origin issued 2021, represented by MoT+++',
    price: 'sold',
    active: true,
    images: imageRefs(['phi-long-le/hunting-05.jpg']),
  },

  // 14. Truong Tan — Untitled series (large)
  {
    _id: 'trash-truong-tan-untitled-large',
    _type: 'trashItem',
    artist: 'Truong Tan',
    title: 'Untitled (series)',
    year: 1996,
    medium: 'ink on paper',
    dimensions: '80 × 62 cm each',
    edition: 'unique works; 2 sold',
    description: 'Works from Truong Tan\'s early practice at Hanoi Fine Arts University. Born 1963 in Hanoi, Truong Tan lives and works between Paris and Hanoi. His ink drawings from this period explore identity, the body, and sexuality with a raw directness that was transgressive in Vietnam at the time.',
    sold: false,
    price: '5,000 USD each',
    provenanceNotes: 'Price list notes 2 works sold. Exact sold works unconfirmed.',
    active: true,
    images: truongImages,
  },

  // 15. Truong Tan — Untitled series (small)
  {
    _id: 'trash-truong-tan-untitled-small',
    _type: 'trashItem',
    artist: 'Truong Tan',
    title: 'Untitled (series)',
    year: 1996,
    medium: 'ink on paper',
    dimensions: '53 × 70 cm each',
    edition: 'unique works; 2 sold',
    description: 'Works from Truong Tan\'s early practice at Hanoi Fine Arts University. Born 1963 in Hanoi, Truong Tan lives and works between Paris and Hanoi. His ink drawings from this period explore identity, the body, and sexuality with a raw directness that was transgressive in Vietnam at the time.',
    sold: false,
    price: '4,000 USD each',
    provenanceNotes: 'Price list notes 2 works sold. Exact sold works unconfirmed.',
    active: true,
    images: truongImages,
  },

  // 16. Aliansyah Caniago — Hunters and Gatherers vol. 1
  {
    _id: 'trash-aliansyah-caniago-hunters-gatherers',
    _type: 'trashItem',
    artist: 'Aliansyah Caniago',
    title: 'Hunters and Gatherers vol. 1',
    year: 2019,
    medium: 'chalk on canvas',
    dimensions: '4 × 1.8 m',
    description: "Created at MoT+++'s performance plus residency in Ho Chi Minh City, December 2019. Aliansyah Caniago is a co-founder of MoT+++ and an interdisciplinary artist whose practice critically examines intersections of power, social injustice, and environmental crises.",
    sold: false,
    price: '15,000 USD',
    active: true,
    images: aliansyahImages,
  },

  // 17. Cam Xanh — Masturbation Trilogies (neon) — no images
  {
    _id: 'trash-cam-xanh-masturbation-trilogies-neon',
    _type: 'trashItem',
    artist: 'Cam Xanh',
    title: 'Masturbation Trilogies — neon',
    year: 2017,
    medium: 'neon light',
    dimensions: 'approx. 35 × 120 cm',
    edition: '1/5 + 1 AP',
    description: "Part of Cam Xanh's solo exhibition 'Masturbation Trilogies' — a brash hat-trick of works presented in sets of three. The neon work is one of three tinted acrylic urinals that hang on a pink wall like whimsical decorations, alluding to both Duchamp and Gober.",
    sold: false,
    price: '1,500 USD',
    active: true,
  },

  // 18. Cam Xanh — FIO series
  {
    _id: 'trash-cam-xanh-fio',
    _type: 'trashItem',
    artist: 'Cam Xanh',
    title: 'FIO (Freedom, Independence, Orgasm)',
    year: 2016,
    medium: 'marker on silk cocoons and acrylic on canvas',
    dimensions: 'approx. 100 × 100 cm each, 3 works',
    description: "Three works: F for Freedom (2017), I in Independence (2017), O off Orgasm (2016). The FIO series uses silk cocoons — a recurring material in Cam Xanh's practice — inscribed with the Vietnamese constitutional values 'freedom – independence – happiness', subverted through the addition of 'orgasm'.",
    sold: false,
    price: 'on request',
    active: true,
    images: fioImages,
  },

  // 19. Phuong Linh Nguyen — Cao – Xà – Lá
  {
    _id: 'trash-phuong-linh-cao-xa-la',
    _type: 'trashItem',
    artist: 'Phuong Linh Nguyen',
    title: 'Cao – Xà – Lá (Rubber, Soap, Tobacco)',
    year: 2012,
    medium: 'rubber, soap, tobacco, iron',
    dimensions: '120 × 60 × 60 cm each, 3 pieces',
    edition: 'unique + 1 AP',
    description: 'Three compressed cubes — rubber, soap, tobacco — each on an iron pedestal, inspired by the Yellow Star Rubber Factory, Hanoi Soap Factory, and Thang Long Tobacco Factory: three companies established in the 1950s–60s that marked Vietnam\'s first capacity for light industrial production. Phuong Linh examines the intersection of personal memory and collective history through these objects of common consumption.',
    sold: false,
    price: '14,000 USD',
    active: true,
    images: phuongLinhImages,
  },

  // 20. Bang Nhat Linh — The Vacant Chair
  {
    _id: 'trash-bang-nhat-linh-vacant-chair',
    _type: 'trashItem',
    artist: 'Bang Nhat Linh',
    title: 'The Vacant Chair',
    sold: false,
    price: '30,000 USD',
    active: true,
    images: bangImages,
  },

  // 21. Nguyen Huy An — Cái Ao (The Pond) series — no images
  {
    _id: 'trash-nguyen-huy-an-cai-ao',
    _type: 'trashItem',
    artist: 'Nguyen Huy An',
    title: 'Cái Ao (The Pond) series',
    year: 2004,
    medium: 'watercolor on Dó paper',
    dimensions: 'variable (mostly 80 × 100 cm)',
    description: "The Pond series — the pond which appears in every village in the North of Vietnam, consolidated and stagnant, is an important allegory of Northern Vietnamese profoundness yet self-contained and isolated. Above and reflecting on the pond is the 'water-temple', where Huy An spent most of his childhood. The pond's stagnancy consolidates into minimalist form, stands still as a Buddha figure.",
    sold: false,
    price: '1,500–3,000 USD each',
    active: true,
  },

  // 22. Lap Phuong — Dâng — no images
  {
    _id: 'trash-lap-phuong-dang',
    _type: 'trashItem',
    artist: 'Lap Phuong',
    title: 'Dâng',
    year: 2020,
    medium: 'copper',
    dimensions: '26 × 16 × 9 cm',
    description: 'A minimalist copper sculpture by Lap Phuong (b.1989, Vietnam), whose practice works with metal sheeting, reshaping the material in an exploration of the passions and tensions that imbue human life. She often explores themes of freedom, identity and sexuality through this manipulation of raw material.',
    sold: false,
    price: '2,950 USD',
    active: true,
  },
];

// ── Artist documents ──────────────────────────────────────────────────────────

const artistDocs = [
  {
    _id: 'artist-nguyen-huy-an',
    _type: 'artist',
    name: 'Nguyen Huy An',
    slug: { _type: 'slug', current: 'nguyen-huy-an' },
    birthYear: 1982,
    nationality: 'Vietnamese',
    originCity: 'Hanoi',
    currentCity: 'Hanoi',
    bio: 'Nguyen Huy An (b.1982) is a Hanoi-based painter working primarily in watercolor on Dó paper. He graduated from Hanoi University of Fine Art with a BFA in 2008. His practice centres on The Pond series — the pond which appears in every village in the North of Vietnam, an allegory of Northern Vietnamese profoundness yet self-containment and isolation. Above and reflecting on the pond is the \'water-temple\', where Huy An spent most of his childhood playing around and observing villagers\' activities: worshipping, festival, community gatherings. The pond\'s stagnancy consolidates into minimalist form, standing still as a Buddha figure. His works have been collected by the Nguyen Art Foundation, Ho Chi Minh City.',
    isAfarmResident: false,
    active: true,
  },
  {
    _id: 'artist-truong-tan',
    _type: 'artist',
    name: 'Truong Tan',
    slug: { _type: 'slug', current: 'truong-tan' },
    birthYear: 1963,
    nationality: 'Vietnamese',
    originCity: 'Hanoi',
    currentCity: 'Paris and Hanoi',
    bio: 'Truong Tan (b.1963, Hanoi) is a Vietnamese artist living and working between Paris and Hanoi. He studied at Hanoi Fine Art School (1977–1982), Hanoi Fine Arts University (1989), and subsequently taught there as a lecturer (1989–1998). His work — primarily ink on paper — explores identity, the body, and sexuality with a directness that was transgressive in Vietnam at the time of their making. Solo exhibitions include Galerie Quynh, Ho Chi Minh City (2019); Thavibu Gallery, Bangkok (2010); Ryllega Gallery, Hanoi (2004, 2005); Nha San, Hanoi (2002); Espace Chateauneuf, Tours (2000); and multiple exhibitions in Paris and Berlin throughout the 1990s.',
    isAfarmResident: false,
    active: true,
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
  const allDocs = [...trashItems, ...artistDocs];
  let created = 0;
  let failed = 0;

  console.log(`\n${DRY_RUN ? '[DRY RUN] ' : ''}Processing ${trashItems.length} trash items + ${artistDocs.length} artist profiles\n`);

  for (const doc of allDocs) {
    // Strip empty images arrays to avoid Sanity validation errors
    if (doc.images && doc.images.length === 0) {
      delete doc.images;
    }

    const label = `${doc._type} / ${doc._id}`;

    if (DRY_RUN) {
      const imgCount = doc.images ? doc.images.length : 0;
      console.log(`[dry-run] Would create: ${label} (${imgCount} images)`);
      created++;
      continue;
    }

    try {
      await client.createOrReplace(doc);
      const imgCount = doc.images ? doc.images.length : 0;
      console.log(`✓ ${label} (${imgCount} images)`);
      created++;
    } catch (err) {
      console.error(`✗ ${label}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Done. ${created} created/replaced, ${failed} failed.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
