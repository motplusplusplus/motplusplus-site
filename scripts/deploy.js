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
//    then runs verify-deploy (fails loudly if the live site is still serving a stale
//    build — see ISSUE-011 / ARCHITECTURE.md §9) and verify-content (fails if live
//    profile pages don't match Sanity).
// 5. Pre-warms Sanity's image CDN with the /trash grid sizes (best effort, never fails).

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
  // One automatic retry: build-time fetches (Sanity API) fail transiently — 2026-11-17 saw a
  // Sanity 524 and a DNS blip back to back. A second failure is real, so let it abort.
  try {
    run('npx next build --webpack');
  } catch {
    console.warn('\n⚠️  build failed — retrying once in 20s (transient network errors are common)');
    execSync('sleep 20');
    run('npx next build --webpack');
  }
  run('npx wrangler deploy');
  run('node scripts/purge-cache.js'); // purge BEFORE verify so verify validates the post-purge state
  run('node scripts/verify-deploy.js');
  run('node scripts/verify-content.js'); // live profile pages must match Sanity, not just the BUILD_ID
  // Best effort, never fails: ask Sanity's CDN for every /trash grid size once,
  // so the first real visitors don't wait on fresh resizes (largest paint on phones).
  try { run('node scripts/prewarm-images.mjs'); } catch { console.warn('⚠️  image prewarm failed (not fatal)'); }
}

main();
