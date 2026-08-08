#!/usr/bin/env node
// Single entrypoint for `npm run deploy`.
//
// 1. Loads NEXT_PUBLIC_MAPBOX_TOKEN, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
//    from .env.local (same loader Next.js itself uses).
// 2. Verifies the git working tree is clean and origin/main matches local main —
//    a deploy from any other state would be silently reverted by the "Deploy site"
//    GitHub Action next time it runs from origin/main.
// 3. Does a clean build (rm -rf .next out && next build) so stale output can't ship.
// 4. Runs wrangler deploy, purges the Cloudflare edge cache (if a purge token is configured),
//    then runs verify-deploy (which fails loudly if the live site is still serving a stale
//    build — see ISSUE-011 / ARCHITECTURE.md §9).

'use strict';

const { execSync } = require('child_process');
const { rmSync } = require('fs');
const { join } = require('path');
const { loadEnvConfig } = require('@next/env');
const { tokenProblem } = require('./mapboxToken');

const ROOT = join(__dirname, '..');

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function checkRequiredEnv() {
  const required = ['NEXT_PUBLIC_MAPBOX_TOKEN', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\n❌  Missing required env var(s): ${missing.join(', ')}`);
    console.error('    Add them to .env.local and re-run npm run deploy.\n');
    process.exit(1);
  }
  // Present is not the same as usable. A token carrying a line break is
  // non-empty, inlines fine, and still takes the map down — see scripts/mapboxToken.js.
  const problem = tokenProblem(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  if (problem) {
    console.error(`\n❌  NEXT_PUBLIC_MAPBOX_TOKEN ${problem}`);
    console.error('    Fix it in .env.local and re-run npm run deploy.\n');
    process.exit(1);
  }
}

function checkGitState() {
  const branch = git('rev-parse --abbrev-ref HEAD');
  if (branch !== 'main') {
    console.error(`\n❌  On branch '${branch}', not 'main'.`);
    console.error('    Switch to main before deploying — origin/main is what the\n    "Deploy site" GitHub Action redeploys from.\n');
    process.exit(1);
  }

  const status = git('status --porcelain');
  if (status) {
    console.error('\n❌  Working tree is not clean:\n');
    console.error(status);
    console.error('\n    Commit or stash these changes before deploying.\n');
    process.exit(1);
  }

  try {
    git('fetch origin main --quiet');
  } catch (err) {
    console.error('\n❌  Could not fetch origin/main — check your network/git remote.\n');
    console.error(err.message);
    process.exit(1);
  }

  const local = git('rev-parse HEAD');
  const remote = git('rev-parse origin/main');
  if (local !== remote) {
    console.error(`\n❌  Local main (${local.slice(0, 7)}) and origin/main (${remote.slice(0, 7)}) have diverged.`);
    console.error('    Push your commits to origin/main before deploying — otherwise the next');
    console.error('    automated redeploy from origin/main will silently revert this deploy.\n');
    process.exit(1);
  }
}

function purgeCache() {
  const zone = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_CACHE_PURGE_TOKEN;
  if (!zone || !token) {
    console.warn('\n⚠️  Edge-cache purge skipped — CLOUDFLARE_ZONE_ID and/or CLOUDFLARE_CACHE_PURGE_TOKEN');
    console.warn('    not set in .env.local. A zone "Cache Everything" rule (ISSUE-011) can serve a stale');
    console.warn('    HTML copy after deploy. Create a token scoped to Zone > Cache Purge > Purge for');
    console.warn('    motplusplusplus.com and add it as CLOUDFLARE_CACHE_PURGE_TOKEN, or purge manually via');
    console.warn('    the Cloudflare dashboard. (verify-deploy still catches stale HTML and fails loudly.)');
    return;
  }
  console.log('\n$ purge Cloudflare edge cache (purge_everything)');
  // Prefix/wildcard purge (e.g. /profiles/*) requires an Enterprise plan; purge_everything is the
  // reliable option on this plan and is cheap for a fully-static site.
  let res;
  try {
    res = execSync(
      `curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache" ` +
        `-H "Authorization: Bearer ${token}" -H "Content-Type: application/json" ` +
        `--data '{"purge_everything":true}'`,
      { cwd: ROOT, encoding: 'utf8' }
    );
  } catch (err) {
    console.error('  ✗ cache purge request failed:', err.message);
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(res);
  } catch {
    console.error('  ✗ cache purge: unexpected response:', res);
    process.exit(1);
  }
  if (parsed.success) {
    console.log('  ✓ edge cache purged');
  } else {
    console.error('  ✗ cache purge failed:', JSON.stringify(parsed.errors));
    console.error('    The token likely lacks Zone > Cache Purge permission (see ISSUE-011).');
    process.exit(1);
  }
}

function main() {
  loadEnvConfig(ROOT, false, { info: () => {}, error: console.error });

  checkRequiredEnv();
  checkGitState();

  // Clean both .next AND out so a stale export can never ship — out/ is what wrangler uploads.
  rmSync(join(ROOT, '.next'), { recursive: true, force: true });
  rmSync(join(ROOT, 'out'), { recursive: true, force: true });
  // --webpack: Next 16 defaults `next build` to Turbopack, which does not inline
  // NEXT_PUBLIC_* env vars the way webpack does — leaves process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  // unresolved at runtime (resolves to "" in the browser), silently breaking the museum map.
  run('npx next build --webpack');
  run('npx wrangler deploy');
  purgeCache(); // purge BEFORE verify so verify-deploy validates the post-purge state
  run('node scripts/verify-deploy.js');
}

main();
