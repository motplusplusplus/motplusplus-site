#!/usr/bin/env node
// Email an alert when the "Deploy site" workflow fails (after its automatic build retry).
// Sends through the Gmail API as info@motplusplusplus.com, the same OAuth credentials
// (send-only, gmail.send scope) that the mot-outbox repo's scripts/send_outbox.py uses.
//
// Required env (Actions secrets; names identical to mot-outbox):
//   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
// Optional env:
//   ALERT_TO        recipient (default info@motplusplusplus.com)
//   ALERT_FROM      sender; must be info@ or a verified send-as of it (default info@motplusplusplus.com)
//   ALERT_TEST=1    send a clearly labeled TEST alert (used to prove the path works)
//   ALERT_DRY_RUN=1 print the message instead of sending
//   GITHUB_*        run context, provided by Actions
//   FAILED_STEP     name of the failed step, if the workflow could work it out
//
// If the secrets are missing this does NOT silently pass: it prints a ::warning:: saying no
// alert went out (the run itself is already red, which is what GitHub notifies repo watchers about).

'use strict';

const to = process.env.ALERT_TO || 'info@motplusplusplus.com';
const from = process.env.ALERT_FROM || 'info@motplusplusplus.com';
const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;
const isTest = process.env.ALERT_TEST === '1';

const repo = process.env.GITHUB_REPOSITORY || 'motplusplusplus/motplusplus-site';
const runId = process.env.GITHUB_RUN_ID || '';
const runUrl = runId ? `https://github.com/${repo}/actions/runs/${runId}` : '(local run)';
const trigger = process.env.GITHUB_EVENT_NAME || 'local';
const sha = (process.env.GITHUB_SHA || '').slice(0, 7) || 'unknown';
const step = process.env.FAILED_STEP || 'unknown (see run log)';

const subject = isTest
  ? '[TEST] MoT+++ site deploy-failure alert'
  : `[MoT+++ site] deploy FAILED - ${trigger} run ${runId || 'local'}`;
const text = isTest
  ? [
      'This is a TEST of the deploy-failure alert for the MoT+++ site repo.',
      'Nothing is wrong. If you can read this, a real failed deploy will reach you the same way.',
      '',
      `sent from: ${runId ? runUrl : 'a local machine'}`,
    ].join('\n')
  : [
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

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const b64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const wrap = (s) => s.replace(/(.{76})/g, '$1\r\n');

function buildMime() {
  const headers = [
    `From: "MoT+++ site alerts" <${from}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  return Buffer.from(`${headers.join('\r\n')}\r\n\r\n${wrap(b64(text))}\r\n`, 'utf8');
}

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`could not get a Gmail access token (HTTP ${res.status}: ${body.error || 'unknown'}${body.error === 'invalid_grant' ? ' - the refresh token was revoked or expired; rerun mot-outbox scripts/make_refresh_token.py' : ''})`);
  }
  return body.access_token;
}

async function main() {
  if (process.env.ALERT_DRY_RUN === '1') {
    console.log(JSON.stringify({ to, from, subject, text }, null, 2));
    return;
  }
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    console.log(`::warning title=No failure alert sent::GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN are not all set, so ${to} was NOT notified of this failed deploy. See ARCHITECTURE.md §9.7.`);
    if (isTest) process.exit(1);
    return;
  }
  try {
    const token = await accessToken();
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: b64url(buildMime()) }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Gmail refused it (HTTP ${res.status}): ${JSON.stringify(body.error?.message ?? body).slice(0, 300)}`);
    console.log(`alert sent to ${to} (gmail message id ${body.id})`);
  } catch (err) {
    console.error(`::error title=Failure alert not sent::${err.message}`);
    process.exit(1);
  }
}

main();
