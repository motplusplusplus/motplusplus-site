// Dry run of the profile portrait-slot fallback (lib/profileImageFallback.ts).
// Read-only: queries the public Sanity API, writes nothing anywhere.
//
//   node scripts/report-profile-image-fallback.mjs            # summary + 10 samples
//   node scripts/report-profile-image-fallback.mjs --all      # every profile
//   node scripts/report-profile-image-fallback.mjs --json     # machine-readable
//
// Covers active Sanity artists — the ones getAllSanityArtistSlugs() builds pages
// for. Uses the very same picker and GROQ fields the page uses; the trash-page
// predicate is read verbatim out of lib/sanity.ts so the two can't drift.
// Counts are over the full result set; any truncation is display-only and says so.

import { readFileSync } from "node:fs";
import { profileImageFallbackFields, pickProfileFallbackImage } from "../lib/profileImageFallback.ts";
import { isJunkImage } from "../lib/junk-images.ts";

const ROOT = new URL("..", import.meta.url);
const sanitySrc = readFileSync(new URL("lib/sanity.ts", ROOT), "utf8");
const constant = (name) => {
  const m = sanitySrc.match(new RegExp(`export const ${name} = \`([\\s\\S]*?)\`;`));
  if (!m) throw new Error(`could not read ${name} from lib/sanity.ts`);
  return m[1];
};
const fields = profileImageFallbackFields(
  `active == true && ${constant("TRASH_ITEM_PRICED")} && ${constant("CONSIGNMENT_CURRENT")}`);

const localPhotos = new Set(
  JSON.parse(readFileSync(new URL("artists-data.json", ROOT), "utf8"))
    .filter(a => a.photo).map(a => a.slug));

const query = `*[_type == "artist" && active == true && !(_id in path("drafts.**"))] | order(name asc) {
  name, "slug": slug.current, "portrait": portrait.asset->url, ${fields}
}`;
const url = "https://t5nsm79o.api.sanity.io/v2026-03-20/data/query/production?query=" + encodeURIComponent(query);
const res = await fetch(url);
if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
const artists = (await res.json()).result;

const rows = artists.map(a => {
  const hasPortrait = !!a.portrait || localPhotos.has(a.slug);
  const pick = hasPortrait ? null : pickProfileFallbackImage(a, isJunkImage);
  return { name: a.name, slug: a.slug, hasPortrait, pick };
});
const noPortrait = rows.filter(r => !r.hasPortrait);
const bySource = { event: 0, work: 0, afarm: 0 };
for (const r of noPortrait) if (r.pick) bySource[r.pick.source]++;
const stillNothing = noPortrait.filter(r => !r.pick);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ total: rows.length, noPortrait: noPortrait.length, bySource, stillNothing: stillNothing.map(r => r.slug), rows }, null, 1));
} else {
  console.log(`active profiles: ${rows.length}`);
  console.log(`with portrait (Sanity or local photo): ${rows.length - noPortrait.length}`);
  console.log(`without portrait: ${noPortrait.length}`);
  console.log(`  → event photo: ${bySource.event}`);
  console.log(`  → own work:    ${bySource.work}`);
  console.log(`  → a.Farm host: ${bySource.afarm}`);
  console.log(`  → still nothing: ${stillNothing.length}`);
  const withPick = noPortrait.filter(r => r.pick);
  // samples spread across the alphabet, plus at least one of each source when available
  const show = process.argv.includes("--all") ? withPick : (() => {
    const out = [];
    for (const s of ["work", "afarm"]) { const x = withPick.find(r => r.pick.source === s); if (x) out.push(x); }
    const step = Math.max(1, Math.floor(withPick.length / 10));
    for (let i = 0; out.length < 10 && i < withPick.length; i += step) if (!out.includes(withPick[i])) out.push(withPick[i]);
    return out;
  })();
  console.log(`\nsamples (showing ${show.length} of ${withPick.length}):`);
  for (const r of show) {
    console.log(`- ${r.name} — /profiles/${r.slug}/`);
    console.log(`    [${r.pick.source}] from: ${r.pick.label}${r.pick.href ? `  → ${r.pick.href}` : "  (no link)"}`);
    console.log(`    ${r.pick.url}`);
  }
  console.log(`\nstill nothing (${stillNothing.length}): ${stillNothing.map(r => r.slug).join(", ")}`);
}
