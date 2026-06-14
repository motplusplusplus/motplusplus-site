/**
 * r2-migration-copy.mjs
 *
 * Copies every key in scripts/r2-migration-manifest.json that actually
 * exists in the old bucket (per scripts/r2-old-bucket-motplus-keys.json)
 * from the old personal R2 bucket (site-general) to the new MoT+++ bucket
 * (mot-assets), preserving keys.
 *
 * Resumable: completed keys are appended to
 * scripts/r2-migration-copy-done.json and skipped on rerun.
 *
 * Requires env vars (see .env.local): OLD_R2_ACCOUNT_ID, OLD_R2_ACCESS_KEY_ID,
 * OLD_R2_SECRET_ACCESS_KEY (source bucket), and R2_ACCOUNT_ID,
 * R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (destination bucket).
 *
 * Run: node --env-file=.env.local scripts/r2-migration-copy.mjs
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const OLD = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.OLD_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.OLD_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.OLD_R2_SECRET_ACCESS_KEY,
  },
});

const NEW = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const OLD_BUCKET = 'site-general';
const NEW_BUCKET = 'mot-assets';

const manifest = JSON.parse(fs.readFileSync('scripts/r2-migration-manifest.json', 'utf8'));
const existingInOld = new Set(JSON.parse(fs.readFileSync('scripts/r2-old-bucket-motplus-keys.json', 'utf8')));
const toCopy = manifest.keys.filter(k => existingInOld.has(k));

const DONE_FILE = 'scripts/r2-migration-copy-done.json';
const done = new Set(fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, 'utf8')) : []);
const remaining = toCopy.filter(k => !done.has(k));

console.log(`Total to copy: ${toCopy.length}, already done: ${done.size}, remaining: ${remaining.length}`);

const CONCURRENCY = 12;
let completed = 0;
let failed = [];

function saveDone() {
  fs.writeFileSync(DONE_FILE, JSON.stringify([...done].sort(), null, 2));
}

async function copyKey(key) {
  const got = await OLD.send(new GetObjectCommand({ Bucket: OLD_BUCKET, Key: key }));
  const body = Buffer.from(await got.Body.transformToByteArray());
  await NEW.send(new PutObjectCommand({
    Bucket: NEW_BUCKET,
    Key: key,
    Body: body,
    ContentType: got.ContentType,
  }));
}

async function worker(queue) {
  while (queue.length) {
    const key = queue.shift();
    try {
      await copyKey(key);
      done.add(key);
    } catch (err) {
      failed.push({ key, error: err.message });
    }
    completed++;
    if (completed % 50 === 0 || completed === remaining.length) {
      console.log(`Progress: ${completed}/${remaining.length} (total done across runs: ${done.size}/${toCopy.length})`);
      saveDone();
    }
  }
}

const queue = [...remaining];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
saveDone();

console.log(`\nFinished this run. Total done: ${done.size}/${toCopy.length}`);
if (failed.length) {
  fs.writeFileSync('scripts/r2-migration-copy-failed.json', JSON.stringify(failed, null, 2));
  console.log(`Failed: ${failed.length} (see scripts/r2-migration-copy-failed.json)`);
}
