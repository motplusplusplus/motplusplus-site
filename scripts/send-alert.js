#!/usr/bin/env node
// Email an alert when the "Deploy site" workflow fails (after its automatic build retry).
// Sends through Cloudflare Email Service's REST API (no extra vendor, same account as the Worker).
//
// Required env (set by the workflow):
//   CLOUDFLARE_ACCOUNT_ID   account that owns the zone
//   CLOUDFLARE_EMAIL_TOKEN  API token with Email Sending permission  (Actions secret)
// Optional env:
//   ALERT_TO     recipient            (default info@motplusplusplus.com)
//   ALERT_FROM   sender; its domain must be onboarded to Email Sending
//                                     (default alerts@motplusplusplus.com)
//   ALERT_DRY_RUN=1   print the message instead of sending
//   GITHUB_*     run context, provided by Actions
//   FAILED_STEP  name of the failed step, if the workflow could work it out
//
// If the token is missing this does NOT silently pass: it prints a ::warning:: saying no alert
// went out (the run itself is already red, which is what GitHub notifies repo watchers about).

'use strict';

const to = process.env.ALERT_TO || 'info@motplusplusplus.com';
const from = process.env.ALERT_FROM || 'alerts@motplusplusplus.com';
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_EMAIL_TOKEN;

const repo = process.env.GITHUB_REPOSITORY || 'motplusplusplus/motplusplus-site';
const runId = process.env.GITHUB_RUN_ID || '?';
const runUrl = process.env.GITHUB_RUN_ID ? `https://github.com/${repo}/actions/runs/${runId}` : '(local run)';
const trigger = process.env.GITHUB_EVENT_NAME || 'unknown';
const sha = (process.env.GITHUB_SHA || '').slice(0, 7) || 'unknown';
const step = process.env.FAILED_STEP || 'unknown (see run log)';

const subject = `[MoT+++ site] deploy FAILED — ${trigger} run ${runId}`;
const text = [
  'The "Deploy site" workflow failed, even after the automatic build retry.',
  '',
  `failed step: ${step}`,
  `trigger:     ${trigger}`,
  `commit:      ${sha}`,
  `run:         ${runUrl}`,
  '',
  'Until a later run succeeds, the live site may not reflect recent Sanity edits.',
  'Fix: open the run, read the failed step, and re-run failed jobs (or `npm run deploy` locally).',
].join('\n');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = `<p>${esc(text).replace(/\n/g, '<br>')}</p>`;

async function main() {
  if (process.env.ALERT_DRY_RUN === '1') {
    console.log(JSON.stringify({ to, from, subject, text }, null, 2));
    return;
  }
  if (!account || !token) {
    console.log(`::warning title=No failure alert sent::CLOUDFLARE_EMAIL_TOKEN (and/or account id) is not configured, so ${to} was NOT notified of this failed deploy. See ARCHITECTURE.md §9.7.`);
    return;
  }
  let res, body;
  try {
    res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/email/sending/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, from: { address: from, name: 'MoT+++ deploy alerts' }, subject, text, html }),
    });
    body = await res.json();
  } catch (err) {
    console.error(`::error title=Failure alert not sent::request failed: ${err.message}`);
    process.exit(1);
  }
  if (!res.ok || !body.success) {
    console.error(`::error title=Failure alert not sent::HTTP ${res.status} ${JSON.stringify(body.errors)}`);
    process.exit(1);
  }
  console.log(`alert sent to ${to}:`, JSON.stringify(body.result));
}

main();
