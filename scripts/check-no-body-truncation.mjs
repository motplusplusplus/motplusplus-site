#!/usr/bin/env node
/**
 * Fail the build if any writer script truncates a body field.
 *
 * WHY THIS EXISTS. `scrape-events.py` carried `body = body[:3000]`, and both
 * Wayback scrapers carried `return text[:3000]`. Between them they wrote 41
 * `event.description` and 5 `event.vnDescription` values into Sanity cut mid-word
 * at ~3000 characters, with nothing recording that a tail had been removed. The
 * loss stayed invisible until someone counted characters, years later; only 11 of
 * the 41 turned out to be recoverable from a Wayback archive.
 *
 * `scripts/_bodyguard.py` catches a reintroduced cap at runtime, but only on the
 * paths that actually execute, and only if someone runs the scraper. This is the
 * static half: it reads the source and fails whether or not anything is run.
 *
 * SCOPE. `scripts/` only — these are writers, and what they store is permanent.
 * Truncation at render (`app/events/[slug]/page.tsx` slices a 160-char SEO meta
 * description out of the full stored text) is correct and deliberately not scanned:
 * it is reversible and the stored value stays whole.
 *
 *   node scripts/check-no-body-truncation.mjs
 *   npm run validate
 *
 * To allow a genuine exception, put `body-truncation-ok:` and a reason on the line.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));

/** Fields whose full value is the payload. Cutting these loses data permanently. */
const BODY = String.raw`body|text|description|vn_?description|bio|content|excerpt|abstract|summary|note`;

/**
 * A cap below this is a label, a preview, or a date fragment — `title[:70]`,
 * `m.group(1)[:10]`. At or above it, a writer is discarding prose.
 */
const MIN_CAP = 200;

const RULES = [
  { // Python:  body = body[:3000]   /   return text[:3000]
    name: 'python slice',
    re: new RegExp(String.raw`\b(${BODY})\s*\[\s*:\s*(\d+)\s*\]`, 'gi'),
    cap: (m) => +m[2],
  },
  { // JS/TS:   body.slice(0, 3000)  /  description.substring(0, 3000)
    name: 'js slice/substring',
    re: new RegExp(String.raw`\b(${BODY})\s*\.\s*(?:slice|substring|substr)\s*\(\s*0\s*,\s*(\d+)\s*\)`, 'gi'),
    cap: (m) => +m[2],
  },
  { // Python:  textwrap.shorten(body, 3000)
    name: 'textwrap.shorten',
    re: new RegExp(String.raw`textwrap\.shorten\s*\(\s*[^,]*\b(${BODY})\b[^,]*,\s*(\d+)`, 'gi'),
    cap: (m) => +m[2],
  },
];

const SKIP_DIR = new Set(['node_modules', '.git', '__pycache__', 'phcache']);
const EXT = new Set(['.py', '.mjs', '.js', '.ts', '.tsx']);
const SELF = path.basename(fileURLToPath(import.meta.url));

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.has(path.extname(e.name))) yield p;
  }
}

/**
 * Blank out comments and docstrings, preserving line numbering. Prose *about* a
 * past truncation — including the one this file documents — is not a truncation.
 */
function stripComments(src, ext) {
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  let out = src;
  if (ext === '.py') {
    out = out.replace(/("""|''')[\s\S]*?\1/g, blank);          // docstrings
    out = out.replace(/(^|[^'"])#[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
  } else {
    out = out.replace(/\/\*[\s\S]*?\*\//g, blank);             // block comments
    out = out.replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
  }
  return out;
}

/**
 * Only a slice that is *stored* is a violation: the whole right-hand side of an
 * assignment, or the thing returned. A slice interpolated into a log line or an
 * error message is a preview of a value, not a cut to one — `${text.slice(0,200)}`
 * inside `throw new Error(...)` discards nothing that was going to be written.
 */
const STORED = /(?:^|;|(?<!\$)\{|=>)\s*(?:return\s+|(?:const|let|var)\s+)?[\w.[\]'"]*\s*=?\s*$/;

const findings = [];
for (const file of walk(SCRIPTS)) {
  if (path.basename(file) === SELF) continue; // the patterns above are not violations
  const ext = path.extname(file);
  const lines = stripComments(fs.readFileSync(file, 'utf8'), ext).split('\n');
  const raw = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/body-truncation-ok:/.test(raw[i])) return;
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line))) {
        if (rule.cap(m) < MIN_CAP) continue;
        if (!STORED.test(line.slice(0, m.index))) continue;
        findings.push({
          file: path.relative(path.join(SCRIPTS, '..'), file),
          line: i + 1, rule: rule.name, cap: rule.cap(m), src: raw[i].trim(),
        });
      }
    }
  });
}

if (findings.length) {
  console.error(`\n✗ body truncation in ${findings.length} place(s) — a writer must store the full text.\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  [${f.rule}, cap ${f.cap}]`);
    console.error(`    ${f.src}\n`);
  }
  console.error('Truncate at render, not at write. See scripts/_bodyguard.py for why.');
  console.error("If this really is safe, append a comment containing 'body-truncation-ok: <reason>'.\n");
  process.exit(1);
}

console.log('✓ no body-field truncation in scripts/');
