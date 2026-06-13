// ISSUE-008 Category A fix: clear misassigned bios (another artist's bio verbatim).
// Run: SANITY_WRITE_TOKEN=... node scripts/fix-category-a-bios.mjs
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// slug -> _id, and target bio (undefined => unset/clear; string => set to that text)
const fixes = [
  { slug: 'sonar-lee', id: '64bdb7dd-7887-4560-8d04-48a970469332', bio: null },
  { slug: 'nguyen-giao-xuan', id: 'artist-nguyen-giao-xuan', bio: null },
  { slug: 'sto-len', id: 'a0fefd23-ba94-458f-a57b-97276d46921e', bio: null },
  { slug: 'kin', id: '5bf78417-90d9-4be3-abe9-17f6c26d52d2', bio: null },
  { slug: 'anh-tran', id: 'artist-anh-tran', bio: null },
  { slug: 'hien-tran', id: '92bf3be2-5ff9-4181-9819-63e4f53c9b8b', bio: null },
  { slug: 'mai-thi-tran', id: '4e155ac2-6b8d-4237-b2d1-c35554e2c9a4', bio: null },
  { slug: 'thy-tran', id: 'd78caea1-b411-4c83-9408-ad45877f7d04', bio: null },
  { slug: 'llama-olo', id: '1903ce49-0ace-4298-bee9-5d24a079d386', bio: null },
  { slug: 'espen-iden', id: 'artist-espen-iden', bio: null },
  { slug: 'anh-vo', id: 'artist-anh-vo', bio: 'anh vo is a vietnamese choreographer and writer based in brooklyn, ny.' },
];

for (const f of fixes) {
  let tx = client.patch(f.id);
  if (f.bio === null) {
    tx = tx.unset(['bio']);
  } else {
    tx = tx.set({ bio: f.bio });
  }
  const res = await tx.commit();
  console.log(`patched [${f.slug}] _id=${f.id} -> bio=${f.bio === null ? 'NULL (unset)' : JSON.stringify(f.bio)}`);
}

console.log('\nDone.');
