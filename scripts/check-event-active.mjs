#!/usr/bin/env node
/**
 * Fail the build if a writer creates an `event` document without an `active` field.
 *
 * WHY THIS EXISTS. Every event query in lib/sanity.ts filters `active == true`. A
 * document whose flag is missing fails that filter, so getEventBySlug returns nothing
 * and app/events/[slug]/page.tsx falls back to events-data.json — the LEGACY ARCHIVE
 * that CLAUDE.md says is not the source of truth. The page still renders, so nothing
 * looks broken. That is what makes it dangerous.
 *
 * scripts/create-missing-sanity-events.js omitted the field and produced 36 such events.
 * Their Sanity content was invisible for months: 43 credits across 22 events, and five
 * descriptions recovered from the Wayback corpus totalling 10,527 characters that had
 * been restored and never reached a reader. Nobody hid these — the flag was null, not
 * false.
 *
 * The schema's `initialValue: true` does NOT help here: initial values are a Studio form
 * default, not a server-side default, so anything written through the API skips them.
 *
 *   node scripts/check-event-active.mjs
 *   npm run validate
 *
 * To allow a genuine exception, put `event-active-ok:` and a reason on the line.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const SELF = path.basename(fileURLToPath(import.meta.url));
const SKIP_DIR = new Set(['node_modules', '.git', '__pycache__', 'phcache']);
const EXT = new Set(['.mjs', '.js', '.ts', '.tsx']);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.has(path.extname(e.name))) yield p;
  }
}

/** Blank comments so prose about this bug is not read as the bug. */
function stripComments(src) {
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
}

/**
 * Span of the object literal containing `_type: 'event'`, by brace matching outward from
 * the match. Substring windows guess; brace matching does not.
 */
function objectSpan(src, at) {
  let depth = 0, start = -1;
  for (let i = at; i >= 0; i--) {
    if (src[i] === '}') depth++;
    else if (src[i] === '{') { if (depth === 0) { start = i; break; } depth--; }
  }
  if (start === -1) return null;
  depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

const TYPE_EVENT = /_type\s*:\s*['"`]event['"`]/g;
const HAS_ACTIVE = /(^|[^\w.])active\s*:/;
/** A Sanity write. Without one in the file, no object literal here reaches the dataset. */
const WRITES = /\.createOrReplace\s*\(|\.createIfNotExists\s*\(|\.create\s*\(|\bmutations\b|\.patch\s*\(/;
/** Document-shaped fields. A report row carries one or two; a document carries several. */
const DOC_FIELDS = /(^|[^\w.])(slug|title|description|dateISO|category|displayDate)\s*:/g;

const findings = [];
for (const file of walk(SCRIPTS)) {
  if (path.basename(file) === SELF) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const src = stripComments(raw);
  // No write in the file => nothing here is a document. r2-migration-audit.mjs pushes
  // {_type:'event', slug, field, urls} onto an in-memory report array; that is a row
  // about a document, not a document.
  if (!WRITES.test(src)) continue;
  TYPE_EVENT.lastIndex = 0;
  let m;
  while ((m = TYPE_EVENT.exec(src))) {
    const line = src.slice(0, m.index).split('\n').length;
    if (/event-active-ok:/.test(raw.split('\n')[line - 1] ?? '')) continue;
    const span = objectSpan(src, m.index);
    // A bare `{_type:'event'}` in a query projection or a filter is not a document being
    // written; require the literal to look like a document (it carries a slug or title).
    if (!span) continue;
    const nFields = (span.match(DOC_FIELDS) || []).length;
    if (nFields < 2) continue; // a row about an event, not an event
    if (!HAS_ACTIVE.test(span)) {
      findings.push({ file: path.relative(path.join(SCRIPTS, '..'), file), line });
    }
  }
}

if (findings.length) {
  console.error(`\n✗ ${findings.length} event document(s) built without an \`active\` field.\n`);
  for (const f of findings) console.error(`  ${f.file}:${f.line}`);
  console.error('\nEvery event query filters `active == true`. Without the field the document is');
  console.error('invisible to the site and the page silently falls back to events-data.json.');
  console.error('Add `active: true`. The schema initialValue does not apply to API writes.');
  console.error("If this really is intentional, add a comment containing 'event-active-ok: <reason>'.\n");
  process.exit(1);
}

console.log('✓ every event document written in scripts/ sets `active`');
