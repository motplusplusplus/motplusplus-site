// One-off read-only fetch for ISSUE-008 Category B/C verification.
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  useCdn: false,
});

const slugs = [
  // Category B - "farm past residents / girl in red reopening" roster
  'lu-nguyen', 'hoang-vu', 'carl-stone', 'dan-nguyen', 'duy-nguyen', 'vuong-thien',
  'bill-nguyen', 'nguyen-hoa', 'tran-van-thao', 'nguyen-hong-giang', 'ngo-dinh-bao-chau',
  // Category B - "địa/phương ~ local-liti art walk" roster
  'chicko', 'nguyen-van-du',
  // Category B - "performance plus 2019 artists:" roster
  'mathieu-dufourg', 'tobias-ahlbrecht', 'nguyen-chung',
  // Category B - amanaki/other event rosters
  'annie-thao-phan', 'ken-ueno', 'ho-tuong-danh', 'ayano-otani',
  // Category B - one-liner
  'duy-bao',
  // Category C
  'fad-plastic', 'lys-bui',
];

const docs = await client.fetch(
  `*[_type=="artist" && slug.current in $slugs]{ "id":_id, name, "slug": slug.current, "bio": coalesce(pt::text(bio), bio), nationality, originCity, currentCity, role }`,
  { slugs }
);

const bySlug = new Map(docs.map((d) => [d.slug, d]));

for (const s of slugs) {
  const d = bySlug.get(s);
  if (!d) { console.log(`[${s}] NOT FOUND\n`); continue; }
  console.log(`[${d.slug}] _id=${d.id} name="${d.name}" role=${d.role || '-'} nat=${d.nationality || '-'} origin=${d.originCity || '-'} current=${d.currentCity || '-'}`);
  console.log(`bio (len=${(d.bio||'').length}):\n${d.bio}\n`);
}
