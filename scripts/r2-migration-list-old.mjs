/**
 * r2-migration-list-old.mjs
 *
 * Lists all objects under motplus/ in the old personal R2 bucket
 * (site-general) and cross-checks against scripts/r2-migration-manifest.json
 * (the set of keys actually referenced by MoT+++ data).
 *
 * Requires env vars (see .env.local): OLD_R2_ACCOUNT_ID, OLD_R2_ACCESS_KEY_ID,
 * OLD_R2_SECRET_ACCESS_KEY (source bucket).
 *
 * Run: node --env-file=.env.local scripts/r2-migration-list-old.mjs
 */

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs';

const OLD = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.OLD_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.OLD_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.OLD_R2_SECRET_ACCESS_KEY,
  },
});

const allKeys = [];
let token;
do {
  const res = await OLD.send(new ListObjectsV2Command({
    Bucket: 'site-general',
    Prefix: 'motplus/',
    ContinuationToken: token,
  }));
  for (const obj of res.Contents || []) allKeys.push(obj.Key);
  token = res.IsTruncated ? res.NextContinuationToken : undefined;
} while (token);

fs.writeFileSync('scripts/r2-old-bucket-motplus-keys.json', JSON.stringify(allKeys.sort(), null, 2));

const manifest = JSON.parse(fs.readFileSync('scripts/r2-migration-manifest.json', 'utf8'));
const existing = new Set(allKeys);
const needed = manifest.keys;
const found = needed.filter(k => existing.has(k));
const missing = needed.filter(k => !existing.has(k));

console.log('Total objects under motplus/ in old bucket:', allKeys.length);
console.log('Needed keys (from manifest):', needed.length);
console.log('Found in old bucket:', found.length);
console.log('MISSING from old bucket:', missing.length);
if (missing.length) {
  fs.writeFileSync('scripts/r2-migration-missing.json', JSON.stringify(missing, null, 2));
  console.log('Missing keys written to scripts/r2-migration-missing.json');
  console.log(missing.slice(0, 20));
}
