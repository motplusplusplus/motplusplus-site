const { createClient } = require('@sanity/client');
const fs = require('fs');

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function run() {
  // 1. Fix existing documents: move images[].url → legacyImageUrls[]
  console.log('Fetching existing trash items...');
  const items = await client.fetch(`*[_type == "trashItem"]{_id, images, legacyImageUrls}`);
  console.log(`Found ${items.length} items`);

  for (const item of items) {
    const badImages = (item.images || []).filter(i => i._type === 'imageUrl' && i.url);
    if (badImages.length === 0) continue;

    const urls = badImages.map(i => i.url);
    await client
      .patch(item._id)
      .unset(['images'])
      .set({ legacyImageUrls: urls })
      .commit();
    console.log(`  Fixed ${item._id}: moved ${urls.length} URLs to legacyImageUrls`);
  }

  // 2. Upload Le Quy Tong images to R2 (already uploaded — use the URLs we'll set below)
  // Images were uploaded via Python separately; URLs defined here.
  const leQuyTongUrls = {
    all: [
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/01.jpg',
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/02.jpg',
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/03.jpg',
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/04.jpg',
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/05.jpg',
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/06.jpg',
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/07.jpg',
      'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/trash/le-quy-tong/no3-true-gold.jpg',
    ],
  };

  // 3. Create Le Quy Tong trash items
  const docs = [
    {
      _type: 'trashItem',
      _id: 'trash-le-quy-tong-true-gold-21',
      artist: 'Le Quy Tong',
      title: 'True Gold #21',
      year: 2016,
      medium: 'oil, acrylic on canvas',
      dimensions: '200 × 100 cm',
      edition: 'unique',
      description: 'Le Quy Tong was born in Hanoi in 1977 in an artist family. He graduated from Hanoi Fine Art University and lives and works in Hanoi. True Gold #21 belongs to his ongoing True Gold series — works explicitly related to Vietnamese history, implicating struggles, protests, negotiations and escapes for liberation and freedom in separate places, from Hong Kong to Warsaw to Heiligendamm. The paintings connect incidents of one place in a certain period to different time and locale contexts, raising questions of human perpetual conflicts and revolutions.',
      sold: true,
      soldDate: 'c. 2020',
      price: 'sold',
      provenanceNotes: 'Listed at 14,000 USD. Included in MoT+++ list of works for Le Quy Tong 2020.',
      active: true,
      legacyImageUrls: leQuyTongUrls.all,
    },
    {
      _type: 'trashItem',
      _id: 'trash-le-quy-tong-true-gold-loyalty-no2',
      artist: 'Le Quy Tong',
      title: 'True Gold – Chapter II: The Loyalty, no.2',
      year: 2018,
      medium: 'acrylic, ink and charcoal on paper',
      dimensions: '100 × 70 cm',
      edition: 'unique',
      description: 'Part of Le Quy Tong\'s True Gold – Chapter II: The Loyalty series. Works in this series connect the imagery of historical struggle across geographies and eras, raising questions about the perpetual nature of human conflict and the meaning of loyalty in times of crisis.',
      sold: true,
      soldDate: 'c. 2020',
      price: 'sold',
      provenanceNotes: 'Listed at 5,500 USD. Included in MoT+++ list of works for Le Quy Tong 2020.',
      active: true,
      legacyImageUrls: leQuyTongUrls.all,
    },
    {
      _type: 'trashItem',
      _id: 'trash-le-quy-tong-true-gold-loyalty-no1',
      artist: 'Le Quy Tong',
      title: 'True Gold – Chapter II: The Loyalty, no.1',
      year: 2018,
      medium: 'acrylic, oil on canvas',
      dimensions: '200 × 130 cm',
      edition: 'unique',
      description: 'Part of Le Quy Tong\'s True Gold – Chapter II: The Loyalty series. The large-format canvas continues his investigation into Vietnamese history and the resonances between liberation movements across different places and times.',
      sold: true,
      soldDate: 'c. 2021',
      price: 'sold',
      provenanceNotes: 'Listed at 16,500 USD. Included in MoT+++ list of works for Le Quy Tong 2021.',
      active: true,
      legacyImageUrls: leQuyTongUrls.all,
    },
  ];

  for (const doc of docs) {
    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);
    await client.createOrReplace(doc);
    console.log(`Created: ${doc._id}`);
  }

  console.log('\nDone.');
}

if (!process.env.SANITY_WRITE_TOKEN) {
  // Try to get token from sanity CLI config
  const sanityConfig = require('fs').existsSync(`${process.env.HOME}/.config/sanity/config.json`)
    ? JSON.parse(require('fs').readFileSync(`${process.env.HOME}/.config/sanity/config.json`, 'utf8'))
    : null;
  if (sanityConfig?.authToken) {
    process.env.SANITY_WRITE_TOKEN = sanityConfig.authToken;
    console.log('Using Sanity CLI auth token');
  } else {
    console.error('Error: SANITY_WRITE_TOKEN required');
    process.exit(1);
  }
}

run().catch(console.error);
