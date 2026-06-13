// ISSUE-008 Category B/C research: search events-data.json, CONTENT-ARCHIVE.md,
// and artists-data.json for real bio text about each affected artist.
import fs from 'fs';

const eventsData = JSON.parse(fs.readFileSync('events-data.json', 'utf8'));
const contentArchive = fs.readFileSync('CONTENT-ARCHIVE.md', 'utf8');
const artistsData = JSON.parse(fs.readFileSync('artists-data.json', 'utf8'));

const targets = {
  'lu-nguyen': ['lu nguyen', 'lu nguyễn'],
  'hoang-vu': ['hoang vu', 'hoàng vũ'],
  'carl-stone': ['carl stone'],
  'dan-nguyen': ['dan nguyen', 'demon slayer', 'demonslayer'],
  'duy-nguyen': ['duy nguyen', 'duy nguyễn'],
  'vuong-thien': ['vuong thien', 'vương thiện'],
  'bill-nguyen': ['bill nguyen', 'bill nguyễn'],
  'nguyen-hoa': ['nguyen hoa', 'nguyễn hoá', 'nguyễn hoa'],
  'tran-van-thao': ['tran van thao', 'trần văn thảo'],
  'nguyen-hong-giang': ['nguyen hong giang', 'nguyễn hồng giang', 'writher'],
  'ngo-dinh-bao-chau': ['ngo dinh bao chau', 'ngô đình bảo châu', 'bao chau', 'châu kim sanh'],
  'chicko': ['chicko'],
  'nguyen-van-du': ['nguyen van du', 'nguyễn văn đủ'],
  'mathieu-dufourg': ['mathieu dufourg'],
  'tobias-ahlbrecht': ['tobias ahlbrecht', 'tobias albrecht'],
  'nguyen-chung': ['chung nguyen', 'nguyen chung'],
  'annie-thao-phan': ['annie thao phan', 'annie thảo phan'],
  'ken-ueno': ['ken ueno'],
  'ho-tuong-danh': ['ho tuong danh', 'hồ tường danh', 'danh tuong'],
  'ayano-otani': ['ayano otani'],
  'duy-bao': ['duy bao', 'duy bảo'],
  'fad-plastic': ['fad plastic'],
  'lys-bui': ['lys bui'],
};

function norm(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

// Flatten all event text into one searchable corpus with source labels
const eventTexts = [];
for (const ev of eventsData) {
  const text = [ev.title, ev.description, ev.vnDescription].filter(Boolean).join(' \n ');
  if (text) eventTexts.push({ slug: ev.slug, title: ev.title, text });
}

const normContentArchive = norm(contentArchive);

for (const [slug, terms] of Object.entries(targets)) {
  console.log(`\n${'='.repeat(70)}\n[${slug}] search terms: ${terms.join(', ')}`);

  // artists-data.json check
  const adEntry = artistsData.find((a) => a.slug === slug || norm(a.name || '').includes(norm(slug.replace(/-/g, ' '))));
  if (adEntry) {
    console.log(`  artists-data.json entry found: name="${adEntry.name}" bio=${adEntry.bio ? JSON.stringify(adEntry.bio.slice(0,200)) : '(none)'}`);
  } else {
    console.log('  artists-data.json: no entry');
  }

  // CONTENT-ARCHIVE.md check
  for (const term of terms) {
    const nt = norm(term);
    let idx = normContentArchive.indexOf(nt);
    let count = 0;
    while (idx !== -1 && count < 3) {
      const start = Math.max(0, idx - 150);
      const end = Math.min(contentArchive.length, idx + nt.length + 150);
      console.log(`  CONTENT-ARCHIVE.md hit for "${term}" @${idx}: ...${contentArchive.slice(start, end).replace(/\s+/g, ' ')}...`);
      idx = normContentArchive.indexOf(nt, idx + nt.length);
      count++;
    }
  }

  // events-data.json: find events mentioning this person, distinct from current bio text
  for (const term of terms) {
    const nt = norm(term);
    for (const ev of eventTexts) {
      const nText = norm(ev.text);
      let idx = nText.indexOf(nt);
      let count = 0;
      while (idx !== -1 && count < 2) {
        const start = Math.max(0, idx - 150);
        const end = Math.min(ev.text.length, idx + nt.length + 150);
        console.log(`  events-data.json [${ev.slug}] hit for "${term}": ...${ev.text.slice(start, end).replace(/\s+/g, ' ')}...`);
        idx = nText.indexOf(nt, idx + nt.length);
        count++;
      }
    }
  }
}
