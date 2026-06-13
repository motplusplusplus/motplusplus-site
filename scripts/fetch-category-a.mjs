// One-off read-only fetch for ISSUE-008 Category A verification.
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  useCdn: false,
});

const corrupted = [
  'sonar-lee', 'nguyen-giao-xuan', 'sto-len', 'kin', 'anh-tran',
  'hien-tran', 'mai-thi-tran', 'thy-tran', 'llama-olo', 'espen-iden', 'anh-vo',
];
const sources = ['aliansyah-caniago', 'lap-xuan', 'tran-minh-duc', 'ngo-thanh-bac'];

const all = [...corrupted, ...sources];
const docs = await client.fetch(
  `*[_type=="artist" && slug.current in $slugs]{ "id":_id, name, "slug": slug.current, "bio": coalesce(pt::text(bio), bio) }`,
  { slugs: all }
);

const bySlug = new Map(docs.map((d) => [d.slug, d]));

console.log('=== SOURCE DOCS ===\n');
for (const s of sources) {
  const d = bySlug.get(s);
  if (!d) { console.log(`[${s}] NOT FOUND\n`); continue; }
  console.log(`[${d.slug}] _id=${d.id} name="${d.name}"`);
  console.log(`bio (len=${(d.bio||'').length}):\n${d.bio}\n`);
}

console.log('\n=== CORRUPTED DOCS ===\n');
for (const c of corrupted) {
  const d = bySlug.get(c);
  if (!d) { console.log(`[${c}] NOT FOUND\n`); continue; }
  console.log(`[${d.slug}] _id=${d.id} name="${d.name}"`);
  console.log(`bio (len=${(d.bio||'').length}):\n${d.bio}\n`);
}
