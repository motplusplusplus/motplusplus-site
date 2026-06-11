#!/usr/bin/env node
// Single entrypoint for `npm run deploy`.
//
// 1. Loads NEXT_PUBLIC_MAPBOX_TOKEN, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
//    from .env.local (same loader Next.js itself uses).
// 2. Verifies the git working tree is clean and origin/main matches local main —
//    a deploy from any other state would be silently reverted by the "Deploy site"
//    GitHub Action next time it runs from origin/main.
// 3. Does a clean build (rm -rf .next && next build) so stale output can't ship.
// 4. Runs wrangler deploy, then verify-deploy.

'use strict';

const { execSync } = require('child_process');
const { rmSync } = require('fs');
const { join } = require('path');
const { loadEnvConfig } = require('@next/env');

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

  rmSync(join(ROOT, '.next'), { recursive: true, force: true });
  run('npx next build');
  run('npx wrangler deploy');
  run('node scripts/verify-deploy.js');
}

main();
