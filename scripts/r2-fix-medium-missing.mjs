/**
 * r2-fix-medium-missing.mjs
 *
 * For each MEDIUM-priority missing key (see ISSUE-012), checks the old
 * site-general bucket for the exact key OR a same-stem alternate extension
 * (.jpeg/.jpg/.png swaps). If found, copies to mot-assets under the exact
 * missing key name.
 *
 * Run: node --env-file=.env.local scripts/r2-fix-medium-missing.mjs
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

const MISSING_KEYS = [
  "motplus/events/between-land-sea-ink-rock-paintings-by-saverio-tonoli/02a.farm_rockscpaes_st.jpeg",
  "motplus/events/between-land-sea-ink-rock-paintings-by-saverio-tonoli/08a.farm_rockscpaes_st.jpeg",
  "motplus/events/between-land-sea-ink-rock-paintings-by-saverio-tonoli/09a.farm_rockscpaes_st.jpeg",
  "motplus/events/between-land-sea-ink-rock-paintings-by-saverio-tonoli/10a.farm_rockscpaes_st.jpeg",
  "motplus/events/between-land-sea-ink-rock-paintings-by-saverio-tonoli/11a.farm_rockscpaes_st.jpeg",
  "motplus/events/between-land-sea-ink-rock-paintings-by-saverio-tonoli/between-land-sea-fb.png",
  "motplus/events/between-land-sea-ink-rock-paintings-by-saverio-tonoli/s-1-edited.png",
  "motplus/events/eta-estimated-time-of-arrival-film-screening/munaf_journey_4-1.png",
  "motplus/events/eta-estimated-time-of-arrival-film-screening/s-1-edited.png",
  "motplus/events/eta-estimated-time-of-arrival-film-screening/tedja_my-therapist-said.png",
  "motplus/events/living-today-for-tomorrow/456896256_830689495838770_4765820917362869744_n.jpeg",
  "motplus/events/living-today-for-tomorrow/group-exhibition-fb-banner-leipzig.png",
  "motplus/events/living-today-for-tomorrow/s-1-edited.png",
  "motplus/events/may-open-studio/4.jpeg",
  "motplus/events/may-open-studio/5.jpeg",
  "motplus/events/may-open-studio/6.jpeg",
  "motplus/events/may-open-studio/fb-event.png",
  "motplus/events/may-open-studio/image1.jpeg",
  "motplus/events/may-open-studio/portraitsquare.jpeg",
  "motplus/events/may-open-studio/s-1-edited.png",
  "motplus/events/minimal-prayer-duy-nguyen-vn/minimal-prayer-fb-1.png",
  "motplus/events/minimal-prayer-duy-nguyen-vn/s-1-edited.png",
  "motplus/events/minimal-prayer-duy-nguyen/55a9854.png",
  "motplus/events/minimal-prayer-duy-nguyen/minimal-prayer-fb-1.png",
  "motplus/events/minimal-prayer-duy-nguyen/s-1-edited.png",
  "motplus/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do-2/fb-event.png",
  "motplus/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do-2/s-1-edited.png",
  "motplus/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do-2/tam.png",
  "motplus/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do/fb-event.png",
  "motplus/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do/s-1-edited.png",
  "motplus/events/nhap-vai-ky-uc-mot-buoi-viet-chung-cung-tam-do/tam.png",
  "motplus/events/saigon-dreaming-open-studio-by-ania-reynolds/fb-event_-2.png",
  "motplus/events/saigon-dreaming-open-studio-by-ania-reynolds/s-1-edited.png",
  "motplus/events/saigon-dreaming-open-studio-by-ania-reynolds/synthotronica-pic-credit-j-dean-miller-e1749626494948.jpeg",
  "motplus/events/sombras-nada-mas-shadows-nothing-more/img_9080.jpeg",
  "motplus/events/sombras-nada-mas-shadows-nothing-more/img_9084.jpeg",
  "motplus/events/sombras-nada-mas-shadows-nothing-more/s-1-edited.png",
  "motplus/events/while-the-soil-slumbers-linh-san/s-1-edited.png",
  "motplus/events/while-the-soil-slumbers-linh-san/s4_linh_san.jpeg",
];

function stemAlternates(key) {
  // Returns candidate keys to check: exact key first, then extension swaps
  const dot = key.lastIndexOf('.');
  if (dot === -1) return [key];
  const stem = key.slice(0, dot);
  const ext = key.slice(dot + 1).toLowerCase();
  const alts = ['.jpeg', '.jpg', '.png'].filter(e => e !== '.' + ext).map(e => stem + e);
  return [key, ...alts];
}

async function existsInOld(key) {
  try {
    await OLD.send(new HeadObjectCommand({ Bucket: OLD_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function copyFromOldToNew(srcKey, destKey) {
  const got = await OLD.send(new GetObjectCommand({ Bucket: OLD_BUCKET, Key: srcKey }));
  const body = Buffer.from(await got.Body.transformToByteArray());
  // Determine content type from dest key extension
  const ext = destKey.split('.').pop().toLowerCase();
  const ct = ext === 'png' ? 'image/png' : 'image/jpeg';
  await NEW.send(new PutObjectCommand({
    Bucket: NEW_BUCKET,
    Key: destKey,
    Body: body,
    ContentType: ct,
  }));
}

async function verifyInNew(key) {
  try {
    await NEW.send(new HeadObjectCommand({ Bucket: NEW_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

const results = { fixed: [], notFound: [] };

for (const missingKey of MISSING_KEYS) {
  const candidates = stemAlternates(missingKey);
  let found = null;
  for (const c of candidates) {
    if (await existsInOld(c)) { found = c; break; }
  }

  if (!found) {
    console.log(`NOT FOUND in old bucket: ${missingKey}`);
    results.notFound.push(missingKey);
    continue;
  }

  const isStemSwap = found !== missingKey;
  console.log(`Found ${isStemSwap ? `(alt: ${found.split('/').pop()})` : '(exact)'}: ${missingKey}`);

  try {
    await copyFromOldToNew(found, missingKey);
    const ok = await verifyInNew(missingKey);
    if (ok) {
      console.log(`  ✓ copied → mot-assets/${missingKey}`);
      results.fixed.push({ key: missingKey, source: found });
    } else {
      console.log(`  ✗ copy appeared to succeed but HEAD check failed: ${missingKey}`);
      results.notFound.push(missingKey);
    }
  } catch (err) {
    console.log(`  ✗ copy error: ${err.message}`);
    results.notFound.push(missingKey);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Fixed: ${results.fixed.length}/${MISSING_KEYS.length}`);
console.log(`Not found in old bucket: ${results.notFound.length}`);
if (results.notFound.length) {
  console.log('Keys not found:', results.notFound);
}

fs.writeFileSync('scripts/r2-fix-medium-results.json', JSON.stringify(results, null, 2));
console.log('\nResults written to scripts/r2-fix-medium-results.json');
