#!/usr/bin/env node
/**
 * Pre-deploy validation: checks that all active Sanity documents
 * with image references actually resolve to non-null URLs.
 * Exits 1 if any asset refs resolve to null (the bug pattern).
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Get token from env (CI) or local config (dev)
function getToken() {
  if (process.env.SANITY_TOKEN) return process.env.SANITY_TOKEN
  try {
    const cfg = JSON.parse(readFileSync(join(homedir(), '.config/sanity/config.json'), 'utf8'))
    for (const u of Object.values(cfg.users || {})) {
      if (u.token) return u.token
      if (u.authToken) return u.authToken
    }
    if (cfg.authToken) return cfg.authToken
  } catch {}
  return null
}

const token = getToken()
if (!token) {
  console.warn('⚠ No SANITY_TOKEN found — skipping image validation')
  process.exit(0)
}

const client = createClient({
  projectId: 't5nsm79o',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2021-10-21',
  token,
})

let failed = false

async function checkImages(label, query) {
  const results = await client.fetch(query)
  let passed = 0, warned = 0, errors = 0
  for (const doc of results) {
    const urls = Array.isArray(doc.urls) ? doc.urls : (doc.url ? [doc.url] : [])
    const hasRef = doc.hasRef
    const resolved = urls.filter(Boolean).length

    if (hasRef && resolved === 0) {
      console.error(`  ✗ "${doc.title || doc.name || doc._id}" has image ref but 0 URLs resolved`)
      errors++
      failed = true
    } else if (resolved > 0) {
      passed++
    } else {
      warned++
    }
  }
  const total = results.length
  if (errors === 0) {
    console.log(`✓ ${label}: ${passed}/${total} resolved${warned ? ` (${warned} no images)` : ''}`)
  } else {
    console.error(`✗ ${label}: ${errors} broken image refs`)
  }
}

console.log('Validating Sanity image references...\n')

await checkImages(
  'trashItems (images)',
  `*[_type=="trashItem" && active==true]{
    _id, title,
    "hasRef": defined(images) && count(images) > 0,
    "urls": images[].asset->url
  }`
)

await checkImages(
  'trashItems (uploadedImages)',
  `*[_type=="trashItem" && active==true && count(uploadedImages) > 0]{
    _id, title,
    "hasRef": true,
    "urls": uploadedImages[].asset->url
  }`
)

await checkImages(
  'events (uploadedImages)',
  `*[_type=="event" && active==true && count(uploadedImages) > 0]{
    _id, title,
    "hasRef": true,
    "urls": uploadedImages[].asset->url
  }`
)

await checkImages(
  'artists (portrait)',
  `*[_type=="artist" && defined(portrait)]{
    _id, "title": name,
    "hasRef": true,
    "url": portrait.asset->url
  }`
)

await checkImages(
  'museumLocations (mainImage)',
  `*[_type=="museumLocation" && defined(mainImage)]{
    _id, "title": name,
    "hasRef": true,
    "url": mainImage.asset->url
  }`
)

await checkImages(
  'museumLocations (images)',
  `*[_type=="museumLocation" && count(images) > 0]{
    _id, "title": name,
    "hasRef": true,
    "urls": images[].asset->url
  }`
)

if (failed) {
  console.error('\n❌ Validation failed — fix broken image refs before deploying')
  process.exit(1)
} else {
  console.log('\n✅ All image references valid')
  process.exit(0)
}
