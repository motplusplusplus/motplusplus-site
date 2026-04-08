#!/usr/bin/env node
/**
 * Validates that Sanity image asset references resolve to actual URLs.
 * Catches the `images[].url` vs `images[].asset->url` bug pattern before deploy.
 *
 * Exit 0: all checks pass
 * Exit 1: any asset ref resolves to null/empty (broken reference)
 *
 * Token resolution order:
 *   1. SANITY_TOKEN env var (used in CI)
 *   2. ~/.config/sanity/config.json (used in local dev)
 */

import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PROJECT_ID = 't5nsm79o';
const DATASET = 'production';
const API_VERSION = '2026-03-20';

// ─── Token resolution ─────────────────────────────────────────────────────────

function getSanityToken() {
  if (process.env.SANITY_TOKEN) return process.env.SANITY_TOKEN;
  try {
    const configPath = join(homedir(), '.config', 'sanity', 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const token = config?.users?.[0]?.token;
    if (token) return token;
  } catch {
    // config file not found or unreadable
  }
  return null;
}

const token = getSanityToken();

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  useCdn: false,
  ...(token ? { token } : {}),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

let hasFatal = false;

function pass(label, resolved, total) {
  console.log(`  ✓ ${label}: ${resolved}/${total} images resolved`);
}

function warn(label, message) {
  console.log(`  ⚠  ${label}: ${message}`);
}

function fail(label, message) {
  console.error(`  ✗ ${label}: ${message}`);
  hasFatal = true;
}

/**
 * Check an array of docs where each doc has a `urls` field (string[] with possible nulls).
 * Hard-fails if any doc has only null/empty URLs (broken asset refs).
 * Warns if a doc has no URLs at all (might be intentional).
 */
function checkUrlArray(label, docs) {
  let totalDocs = docs.length;
  let brokenDocs = 0;
  let resolvedDocs = 0;

  for (const doc of docs) {
    const urls = (doc.urls ?? []).filter(Boolean);
    if (urls.length === 0) {
      brokenDocs++;
      fail(label, `"${doc.title ?? doc.name ?? doc._id}" has image refs but 0 URLs resolved`);
    } else {
      resolvedDocs++;
    }
  }

  if (brokenDocs === 0) {
    pass(label, resolvedDocs, totalDocs);
  }
}

/**
 * Check docs where each doc has a single `url` field (string | null).
 * Hard-fails if the URL is null (broken asset ref).
 */
function checkSingleUrl(label, docs) {
  let totalDocs = docs.length;
  let brokenDocs = 0;
  let resolvedDocs = 0;

  for (const doc of docs) {
    if (!doc.url) {
      brokenDocs++;
      fail(label, `"${doc.name ?? doc.title ?? doc._id}" has portrait/image ref but URL resolved to null`);
    } else {
      resolvedDocs++;
    }
  }

  if (brokenDocs === 0) {
    pass(label, resolvedDocs, totalDocs);
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function validateTrashItems() {
  // Docs that explicitly have image refs in `images[]`
  const docs = await client.fetch(
    `*[_type=="trashItem" && active==true && count(images)>0]{
      _id, title,
      "urls": images[].asset->url
    }`
  );
  checkUrlArray('trashItems (images field)', docs);

  // Docs that have refs in `uploadedImages[]`
  const uploadedDocs = await client.fetch(
    `*[_type=="trashItem" && active==true && count(uploadedImages)>0]{
      _id, title,
      "urls": uploadedImages[].asset->url
    }`
  );
  checkUrlArray('trashItems (uploadedImages field)', uploadedDocs);
}

async function validateEvents() {
  const docs = await client.fetch(
    `*[_type=="event" && active==true && count(uploadedImages)>0]{
      _id, title,
      "urls": uploadedImages[].asset->url
    }`
  );
  checkUrlArray('events (uploadedImages)', docs);
}

async function validateArtists() {
  // Artists with a portrait reference
  const docs = await client.fetch(
    `*[_type=="artist" && active==true && defined(portrait)]{
      _id, name,
      "url": portrait.asset->url
    }`
  );
  checkSingleUrl('artists (portrait)', docs);

  // Artists with uploadedImages refs
  const imgDocs = await client.fetch(
    `*[_type=="artist" && active==true && count(uploadedImages)>0]{
      _id, name,
      "urls": uploadedImages[].asset->url
    }`
  );
  checkUrlArray('artists (uploadedImages)', imgDocs);
}

async function validateMuseumLocations() {
  // mainImage
  const mainDocs = await client.fetch(
    `*[_type=="museumLocation" && active==true && defined(mainImage)]{
      _id, title,
      "url": mainImage.asset->url
    }`
  );
  checkSingleUrl('museumLocations (mainImage)', mainDocs);

  // images[]
  const imgDocs = await client.fetch(
    `*[_type=="museumLocation" && active==true && count(images)>0]{
      _id, title,
      "urls": images[].asset->url
    }`
  );
  checkUrlArray('museumLocations (images)', imgDocs);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\nValidating Sanity image asset references...\n');

if (!token) {
  console.warn(
    'Warning: no Sanity token found (SANITY_TOKEN env var or ~/.config/sanity/config.json).\n' +
    'Queries will run as an unauthenticated public read. Some draft docs may be skipped.\n'
  );
}

try {
  await validateTrashItems();
  await validateEvents();
  await validateArtists();
  await validateMuseumLocations();
} catch (err) {
  console.error('\nFailed to query Sanity:', err.message);
  process.exit(1);
}

if (hasFatal) {
  console.error('\n✗ Validation failed — broken asset refs detected. Fix in Sanity Studio before deploying.\n');
  process.exit(1);
} else {
  console.log('\n✓ All image asset references resolved successfully.\n');
  process.exit(0);
}
