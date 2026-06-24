/**
 * investigate-91.js
 *
 * Purpose: re-derive the 91 "newly surfaced" active artist profiles from
 * the sitemap fix (see ISSUE-015 in ISSUES.md), and dump their full
 * bio/context to a single readable file so a human (or a follow-up LLM
 * pass) can judge whether any of them are research SUBJECTS (people
 * written about, not actual participants) rather than real
 * participants/artists.
 *
 * Run from the project root:
 *   SANITY_TOKEN=<token> node scripts/investigate-91.js
 *
 * Output: ./91-profiles-review.md
 *
 * Adapted for this codebase's actual schema:
 *  - trashItem (not trashWork) is the +1 trash document type.
 *  - event.description is a plain string field, not Portable Text --
 *    there is no pt::text() needed, and no separate "body" field exists.
 *  - "old slugs" (the set the buggy sitemap was effectively limited to)
 *    is artists-data.json UNION BIO_SLUGS (lib/events.ts) minus
 *    CONSOLIDATED_BIO_SLUGS (lib/artists.ts) -- matching generateStaticParams'
 *    own union exactly, so "newly surfaced" lands on the same 91 the
 *    project owner was already told about, not a different count.
 */

const { createClient } = require('@sanity/client');
const fs = require('fs');

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 't5nsm79o',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2026-03-20',
  token: process.env.SANITY_TOKEN || process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

function getOldSlugs() {
  const oldData = JSON.parse(fs.readFileSync('./artists-data.json', 'utf8'));
  const jsonSlugs = new Set(oldData.map((a) => a.slug));

  const eventsContent = fs.readFileSync('./lib/events.ts', 'utf8');
  const bioMatch = eventsContent.match(/export const BIO_SLUGS = new Set\(\[([\s\S]*?)\]\)/);
  const bioSlugs = new Set([...bioMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));

  const artistsContent = fs.readFileSync('./lib/artists.ts', 'utf8');
  // Non-greedy match up to "]);" (the actual statement terminator) rather than
  // the first "])" -- a couple of entries have inline comments containing a
  // literal "])" substring (e.g. `alternateNames: ["Irene Ha"]`) that would
  // otherwise truncate the match early and silently drop later entries.
  const consolidatedMatch = artistsContent.match(/CONSOLIDATED_BIO_SLUGS = new Set<string>\(\[([\s\S]*?)\]\);/);
  const consolidatedSlugs = new Set([...consolidatedMatch[1].matchAll(/^\s*'([^']+)'/gm)].map((m) => m[1]));

  const oldSlugs = new Set([...jsonSlugs, ...bioSlugs].filter((s) => !consolidatedSlugs.has(s)));
  console.log(`Old source (JSON ${jsonSlugs.size} + BIO_SLUGS ${bioSlugs.size}, minus ${consolidatedSlugs.size} consolidated): ${oldSlugs.size} slugs`);
  return oldSlugs;
}

async function main() {
  const oldSlugs = getOldSlugs();

  const activeArtists = await client.fetch(`
    *[_type == "artist" && active == true]{
      _id,
      name,
      "slug": slug.current,
      alternateNames,
      "bio": coalesce(pt::text(bio), bio),
      "eventCount": count(*[_type == "event" && references(^._id)]),
      "trashCount": count(*[_type == "trashItem" && references(^._id)])
    }
  `);
  console.log(`Active Sanity artists: ${activeArtists.length}`);

  const newlySurfaced = activeArtists.filter((a) => !oldSlugs.has(a.slug));
  console.log(`Newly surfaced (expect 91): ${newlySurfaced.length}`);

  const allEvents = await client.fetch(`
    *[_type == "event"]{
      _id,
      title,
      "slug": slug.current,
      "descriptionText": coalesce(description, ""),
      "vnDescriptionText": coalesce(vnDescription, "")
    }
  `);
  console.log(`Total events fetched for text-search: ${allEvents.length}`);

  function findNameMentions(names) {
    const matches = [];
    for (const ev of allEvents) {
      const safe = (v) => (typeof v === 'string' ? v : '');
      const haystack = `${safe(ev.title)} ${safe(ev.descriptionText)} ${safe(ev.vnDescriptionText)}`;
      for (const n of names) {
        if (!n) continue;
        if (haystack.toLowerCase().includes(n.toLowerCase())) {
          matches.push({ slug: ev.slug, title: ev.title, matchedOn: n });
          break;
        }
      }
    }
    return matches;
  }

  newlySurfaced.forEach((a) => {
    const namesToCheck = [a.name, ...(a.alternateNames || [])].filter(Boolean);
    a.nameMentions = findNameMentions(namesToCheck);
  });

  let out = `# 91 Newly-Surfaced Profiles -- Review for Subject vs. Participant\n\n`;
  out += `Generated: ${new Date().toISOString()}\n`;
  out += `Total found: ${newlySurfaced.length}\n\n`;
  out += `For each profile below, judge: does this read like a real participant\n`;
  out += `(artist, performer, resident, collaborator) in MoT+++/a.Farm programs,\n`;
  out += `or like a historical/biographical SUBJECT that someone else researched\n`;
  out += `or wrote about?\n\n`;
  out += `Signals worth weighing:\n`;
  out += `- eventCount / trashCount == 0 AND zero name-mentions in event text\n`;
  out += `  -- strongest "likely subject, not participant" signal\n`;
  out += `- Bio reads third-person-historical rather than program-voice\n`;
  out += `- Bio describes a person from an unrelated era/context with no tie to\n`;
  out += `  any MoT+++/a.Farm program, residency, or event\n\n`;
  out += `Note: a profile CAN have eventCount 0 but still be a real participant\n`;
  out += `if their name shows up in event text -- flagged separately below as\n`;
  out += `"name-mention only, no formal ref" and should NOT be treated as a\n`;
  out += `subject-not-participant candidate.\n\n`;
  out += `---\n\n`;

  const rank = (a) => {
    const hasRef = a.eventCount + a.trashCount > 0;
    const hasMention = a.nameMentions.length > 0;
    if (!hasRef && !hasMention) return 0;
    if (!hasRef && hasMention) return 1;
    return 2;
  };

  newlySurfaced
    .sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      if (ra !== rb) return ra - rb;
      return (a.eventCount + a.trashCount) - (b.eventCount + b.trashCount);
    })
    .forEach((a, i) => {
      const r = rank(a);
      const flag =
        r === 0
          ? 'TOP SUSPECT -- no event/trash reference AND no name mention anywhere'
          : r === 1
          ? 'Name mentioned in event copy but no formal reference (likely a linking gap, probably a real participant)'
          : 'Has formal event/trash-work reference';

      out += `## ${i + 1}. ${a.name} (\`${a.slug}\`)\n\n`;
      out += `**${flag}**\n\n`;
      out += `- Events linked (formal reference): ${a.eventCount}\n`;
      out += `- Trash works linked: ${a.trashCount}\n`;
      out += `- Alternate names: ${(a.alternateNames || []).join(', ') || 'none'}\n`;
      out += `- Name mentions found in event text: ${a.nameMentions.length}\n`;
      if (a.nameMentions.length > 0) {
        out += `  - ${a.nameMentions
          .slice(0, 5)
          .map((m) => `"${m.title}" (matched on "${m.matchedOn}")`)
          .join('\n  - ')}\n`;
        if (a.nameMentions.length > 5) out += `  - ...and ${a.nameMentions.length - 5} more\n`;
      }
      out += `\n**Bio:**\n${a.bio || '_(no bio)_'}\n\n`;
      out += `---\n\n`;
    });

  fs.writeFileSync('./91-profiles-review.md', out);
  const topSuspects = newlySurfaced.filter((a) => rank(a) === 0).length;
  const linkingGaps = newlySurfaced.filter((a) => rank(a) === 1).length;
  console.log(`\nWrote 91-profiles-review.md`);
  console.log(`TOP suspects (no ref, no mention): ${topSuspects}`);
  console.log(`Linking gaps (mention but no ref): ${linkingGaps}`);
  console.log(`Formally referenced: ${newlySurfaced.length - topSuspects - linkingGaps}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
