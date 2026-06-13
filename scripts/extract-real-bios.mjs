import fs from 'fs';

const eventsData = JSON.parse(fs.readFileSync('events-data.json', 'utf8'));
const artistsData = JSON.parse(fs.readFileSync('artists-data.json', 'utf8'));

const adSlugs = ['dan-nguyen', 'dan-nguyen-demonslayer', 'duy-nguyen', 'bill-nguyen', 'nguyen-hoa', 'mathieu-dufourg', 'tobias-ahlbrecht', 'nguyen-chung', 'hoang-vu', 'nguyen-hong-giang', 'vuong-thien'];
console.log('=== artists-data.json entries ===\n');
for (const a of artistsData) {
  if (adSlugs.includes(a.slug)) {
    console.log(`slug="${a.slug}" name="${a.name}"`);
    console.log(`bio: ${a.bio}\n`);
  }
}

const evSlugs = ['motsound-23', 'duy-nguyen', 'bill-nguyen', 'nguyen-hoa', 'mot-sound-25-with-nikola-h-mounoud-and-writher', 'dan-nguyen-demonslayer', 'mot-sound-16-poetry-plus-vol-3'];
console.log('\n=== events-data.json full descriptions ===\n');
for (const ev of eventsData) {
  if (evSlugs.includes(ev.slug)) {
    console.log(`--- [${ev.slug}] "${ev.title}" ---`);
    console.log(ev.description);
    console.log('');
  }
}
