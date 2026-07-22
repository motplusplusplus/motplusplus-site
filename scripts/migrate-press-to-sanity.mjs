/**
 * migrate-press-to-sanity.mjs
 * One-shot, idempotent migration of the hardcoded press list (lib/press.ts) into
 * Sanity `pressItem` documents (task 06). After this runs and is verified live,
 * lib/press.ts and the /press fallback can be deleted in a follow-up commit.
 *
 * The source data is read straight out of lib/press.ts and evaluated in-process
 * (it's a plain array literal of string/null values in our own trusted file) so
 * there is NO transcription/duplication risk — the migrated data is byte-for-byte
 * the current site data.
 *
 * Deterministic _id per item (`pressItem-<slug(outlet)>-<slug(date|'undated')>`)
 * + createOrReplace ⇒ re-running is idempotent (no duplicates).
 *
 * Run:  SANITY_WRITE_TOKEN=xxxx node scripts/migrate-press-to-sanity.mjs
 *       (add --dry to preview without writing)
 * The token needs create/replace on the `pressItem` type. NEVER commit it.
 */
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESS_TS = path.join(__dirname, '..', 'lib', 'press.ts');
const DRY = process.argv.includes('--dry');

// ── Load the current press data from lib/press.ts without duplicating it ────────
function loadPressItems() {
  const src = fs.readFileSync(PRESS_TS, 'utf8');
  const marker = 'export const pressItems: PressItem[] =';
  const start = src.indexOf(marker);
  if (start === -1) throw new Error('Could not find pressItems export in lib/press.ts');
  const arrStart = src.indexOf('[', start);
  const arrEnd = src.indexOf('];', arrStart);
  if (arrStart === -1 || arrEnd === -1) throw new Error('Could not locate the pressItems array literal');
  const literal = src.slice(arrStart, arrEnd + 1); // includes closing ]
  // The literal is a plain JS array of object literals with string/null values.
  // eslint-disable-next-line no-new-func
  const items = new Function(`return ${literal};`)();
  if (!Array.isArray(items) || items.length === 0) throw new Error('Parsed press list is empty');
  return items;
}

function slugify(s) {
  return String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Best-effort ISO date for ordering only. Year-only → Jan 1; month-year → the 1st;
// unparseable / null → undefined (item sorts to the bottom of /press).
function toSortDate(displayDate) {
  if (!displayDate) return undefined;
  const d = new Date(displayDate);
  if (isNaN(d.getTime())) return undefined;
  // Format from LOCAL components (not toISOString, which is UTC and would shift
  // the day across the timezone boundary — e.g. ICT/UTC+7 rolls midnight back a day).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDoc(item) {
  const _id = `pressItem-${slugify(item.outlet)}-${slugify(item.date || 'undated')}`;
  const doc = {
    _id,
    _type: 'pressItem',
    title: item.title,
    outlet: item.outlet,
    url: item.url,
    tag: item.tag,
    excerpt: item.excerpt || '',
    active: true,
  };
  // Preserve the human date string verbatim (omit entirely when null so /press
  // hides the date line, exactly as today).
  if (item.date) doc.displayDate = item.date;
  const sortDate = toSortDate(item.date);
  if (sortDate) doc.sortDate = sortDate;
  return doc;
}

async function run() {
  const items = loadPressItems();
  const docs = items.map(buildDoc);

  // Guard: deterministic _ids must be unique (else createOrReplace would collapse
  // two source rows into one → data loss).
  const ids = new Set();
  for (const d of docs) {
    if (ids.has(d._id)) throw new Error(`Duplicate _id ${d._id} — two source rows collide; aborting to avoid data loss.`);
    ids.add(d._id);
  }

  console.log(`Loaded ${items.length} press items from lib/press.ts → ${docs.length} pressItem docs.\n`);
  docs.forEach((d) => console.log(`  ${d._id}\n    ${d.outlet} — ${d.title}  [${d.displayDate ?? 'undated'} / sort:${d.sortDate ?? '—'} / tag:${d.tag}]`));

  if (DRY) {
    console.log('\n--dry: no writes performed.');
    return;
  }

  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) {
    console.error('\n❌  SANITY_WRITE_TOKEN not set. Run:  SANITY_WRITE_TOKEN=xxxx node scripts/migrate-press-to-sanity.mjs');
    process.exit(1);
  }

  const client = createClient({
    projectId: 't5nsm79o',
    dataset: 'production',
    apiVersion: '2026-03-20',
    token,
    useCdn: false,
  });

  let tx = client.transaction();
  for (const d of docs) tx = tx.createOrReplace(d);
  await tx.commit();

  console.log(`\n✅  ${docs.length} pressItem documents created/replaced in Sanity (production).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
