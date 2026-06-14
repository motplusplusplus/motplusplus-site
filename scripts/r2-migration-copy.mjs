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
 * Run: node scripts/r2-migration-copy.mjs
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const OLD = new S3Client({
  region: 'auto',
  endpoint: 'https://31a35595add67ae1366b3f6420432773.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '83343e12beb2f0aed8d48bc3047814a2',
    secretAccessKey: '8d3e7535a2e3ed492102802160c1a51cb94ee306c6f95cecb9cb3fa537c3ca56',
  },
});

const NEW = new S3Client({
  region: 'auto',
  endpoint: 'https://f2a86349fa252c2582bc0f478ccdf9ab.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '747bda2b507d120f95792a93b9576ec4',
    secretAccessKey: '84d764a2f5f9f343e7f59f8c055ae47b322f5f0653c111b38db843fe74b475e3',
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
