/**
 * One-time migration: convert all artist `bio` (and `vnBio`) fields from
 * plain text strings to Portable Text block arrays.
 *
 * - Splits on double-newlines to produce one block per paragraph
 * - Restores known hyperlinks for Andrew Newell Walther's bio
 * - Skips docs whose bio field is already a PT array
 * - Patches published docs directly (bypasses draft workflow — correct for
 *   data migrations; any open drafts would overwrite on next publish)
 *
 * Usage:
 *   node scripts/migrate-bio-to-pt.mjs [--dry-run]
 */

import https from 'https';
import fs from 'fs';
import { randomBytes } from 'crypto';

const token = JSON.parse(
  fs.readFileSync(process.env.HOME + '/.config/sanity/config.json', 'utf8')
).authToken;

const PROJECT_ID  = 't5nsm79o';
const DATASET     = 'production';
const API_VERSION = '2026-03-20';
const DRY_RUN     = process.argv.includes('--dry-run');

if (DRY_RUN) console.log('[dry-run] No mutations will be written.\n');

// ── Portable Text helpers ─────────────────────────────────────────────────────

function key() {
  return randomBytes(5).toString('hex');
}

/**
 * Convert a plain-text string to a Portable Text block array.
 * `links` is an array of { phrase, href } describing substrings in the text
 * that should become clickable links.
 */
function textToBlocks(text, links = []) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  return paragraphs.map(para => {
    const blockKey  = key();
    const markDefs  = [];
    const children  = [];

    // Find all link occurrences in this paragraph (case-insensitive search,
    // preserve original casing in the output span text).
    const occurrences = [];
    for (const link of links) {
      const lower    = para.toLowerCase();
      const phraseLo = link.phrase.toLowerCase();
      let idx = lower.indexOf(phraseLo);
      while (idx !== -1) {
        occurrences.push({ start: idx, end: idx + link.phrase.length, href: link.href });
        idx = lower.indexOf(phraseLo, idx + 1);
      }
    }

    if (occurrences.length === 0) {
      children.push({ _type: 'span', _key: key(), text: para, marks: [] });
    } else {
      // Sort by position and build interleaved spans + link spans
      occurrences.sort((a, b) => a.start - b.start);
      let cursor = 0;
      for (const occ of occurrences) {
        if (occ.start > cursor) {
          children.push({ _type: 'span', _key: key(), text: para.slice(cursor, occ.start), marks: [] });
        }
        const linkKey = key();
        markDefs.push({ _type: 'link', _key: linkKey, href: occ.href });
        children.push({ _type: 'span', _key: key(), text: para.slice(occ.start, occ.end), marks: [linkKey] });
        cursor = occ.end;
      }
      if (cursor < para.length) {
        children.push({ _type: 'span', _key: key(), text: para.slice(cursor), marks: [] });
      }
    }

    return { _type: 'block', _key: blockKey, style: 'normal', children, markDefs };
  });
}

// ── Known links to restore ────────────────────────────────────────────────────

const KNOWN_LINKS = {
  'andrew-newell-walther': [
    { phrase: 'psalmus diuersae', href: 'https://www.discogs.com/label/718824-Psalmus-Diuersae' },
    { phrase: 'manhattan art comic', href: 'https://manhattanartreview.com/manhattanartcomic.html' },
  ],
};

// ── Sanity REST helpers ───────────────────────────────────────────────────────

function sanityRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path:     `/v${API_VERSION}/data/${path}/${DATASET}`,
      method,
      headers: {
        Authorization:   `Bearer ${token}`,
        'Content-Type':  'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }, res => {
      let data = '';
      res.on('data', d => (data += d));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function applyMutations(mutations) {
  const res = await sanityRequest('mutate', 'POST', {
    mutations,
    returnDocuments: false,
    visibility: 'async',
  });
  if (res.error) throw new Error(JSON.stringify(res.error, null, 2));
  return res;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Fetch all published artist docs (filter in JS to avoid GROQ defined() edge cases)
  const { result: docs } = await sanityRequest('query', 'POST', {
    query: `*[_type == "artist" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, bio, vnBio }[0...500]`,
  });

  console.log(`Fetched ${docs.length} artist docs with bio/vnBio fields.\n`);

  const mutations = [];

  for (const doc of docs) {
    const { _id, slug, bio, vnBio } = doc;
    const setPatch = {};

    // ── English bio ──────────────────────────────────────────────────────────
    if (typeof bio === 'string' && bio.trim()) {
      const links = KNOWN_LINKS[slug] ?? [];
      const blocks = textToBlocks(bio, links);
      setPatch.bio = blocks;
      const linkCount = blocks.flatMap(b => b.markDefs).length;
      console.log(`  [bio]   ${slug || _id} — ${blocks.length} paragraph(s)${linkCount ? `, ${linkCount} link(s)` : ''}`);
    } else if (bio !== null && bio !== undefined && typeof bio !== 'string') {
      console.log(`  [bio]   ${slug || _id} — already PT, skipping`);
    } else if (!bio) {
      // null / empty — nothing to migrate
    }

    // ── Vietnamese bio ───────────────────────────────────────────────────────
    if (typeof vnBio === 'string' && vnBio.trim()) {
      const blocks = textToBlocks(vnBio);
      setPatch.vnBio = blocks;
      console.log(`  [vnBio] ${slug || _id} — ${blocks.length} paragraph(s)`);
    } else if (vnBio !== null && vnBio !== undefined && typeof vnBio !== 'string') {
      console.log(`  [vnBio] ${slug || _id} — already PT, skipping`);
    }

    if (Object.keys(setPatch).length === 0) continue;

    mutations.push({ patch: { id: _id, set: setPatch } });
  }

  console.log(`\n${mutations.length} document(s) need migration.`);

  if (DRY_RUN || mutations.length === 0) {
    if (DRY_RUN) console.log('[dry-run] Skipping writes.');
    return;
  }

  // Apply in batches of 50
  for (let i = 0; i < mutations.length; i += 50) {
    const batch = mutations.slice(i, i + 50);
    const res = await applyMutations(batch);
    console.log(`  Batch ${Math.floor(i / 50) + 1}/${Math.ceil(mutations.length / 50)}: applied (transactionId=${res.transactionId})`);
  }

  console.log('\nMigration complete. All bio fields are now Portable Text.');
}

main().catch(err => { console.error(err); process.exit(1); });
