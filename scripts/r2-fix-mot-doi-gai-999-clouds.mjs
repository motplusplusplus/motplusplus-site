/**
 * One-off fix for a single broken image found during a site health-check crawl:
 * events-data.json (legacy archive, not editable) references
 * cam-xanh-mot-doi-gai-999-9-clouds.jpeg, but the migrated file in mot-assets
 * is named ...999-9-clouds.jpg (no "e"). Same root cause as ISSUE-012 (JSON
 * archive extension mismatch) -- same fix: copy the existing object to the
 * exact missing key name, same bucket.
 *
 * Run: node --env-file=.env.local scripts/r2-fix-mot-doi-gai-999-clouds.mjs
 */

import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = 'mot-assets';
const SOURCE_KEY = 'motplus/events/mot-doi-gai-a-beach-life-cam-xanh/cam-xanh-mot-doi-gai-999-9-clouds.jpg';
const MISSING_KEY = 'motplus/events/mot-doi-gai-a-beach-life-cam-xanh/cam-xanh-mot-doi-gai-999-9-clouds.jpeg';

const obj = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: SOURCE_KEY }));
const body = await obj.Body.transformToByteArray();

await client.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: MISSING_KEY,
  Body: body,
  ContentType: 'image/jpeg',
}));

const verify = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: MISSING_KEY }));
console.log(`Copied. New object size: ${verify.ContentLength} bytes`);
