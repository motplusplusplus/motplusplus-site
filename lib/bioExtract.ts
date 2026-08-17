// a.Farm bio-page events (see BIO_SLUGS in lib/events.ts) carry no "ABOUT THE ARTIST"
// heading — the whole post already is the bio, with the funder-credit template appended
// as a trailing paragraph. Extracting from a heading that doesn't exist would zero out
// all of them; the template paragraph itself is the real boundary. See the 2026-08-17
// bio-fallback narrowing report.
const AFARM_TEMPLATE_RE =
  /a\.?Farm International Art Residency a Saigon-based art residency, in partnership with the Goethe-Institut Ho Chi Minh City, and support from Amanaki Thao Dien/i;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strip the a.Farm/Goethe-Institut/Amanaki funder-credit template from a bio-page
 * event's description, returning just the authored bio prose before it. A description
 * without the template passes through unchanged — a no-op for every event outside this
 * specific pattern.
 *
 * When artistName is given, also strips a trailing "<Name> – MoT+++" byline glued onto
 * the end of the last sentence with no paragraph break of its own (confirmed present on
 * bert-ackley, mascha-serga, lai-minh-ngoc, ru-marshall and others), optionally followed
 * by a parenthetical alternate name (e.g. "exxonnubile (Julia Weiner) – MoT+++", "Baby
 * Reni (Irene Ha) – MoT+++") — matched against the artist's own name specifically, not a
 * generic pattern, so it can't eat real prose that happens to end near "MoT+++".
 * Deliberately narrow: does NOT attempt to strip other loose fragments that sometimes
 * precede the byline (e.g. a dangling link label like "Vinatapes project", or a "Learn
 * more / about their works: url" line split by a paragraph break) — those are left in
 * place rather than guessed at.
 */
export function extractBioFromEventDescription(description: string, artistName?: string): string {
  const idx = description.search(AFARM_TEMPLATE_RE);
  if (idx === -1) return description;
  let bio = description.slice(0, idx).trimEnd();
  if (artistName) {
    const bylineRe = new RegExp(
      `\\s*${escapeRegExp(artistName)}\\s*(?:\\([^)]*\\))?\\s*[–-]\\s*MoT\\+\\+\\+\\s*$`,
      'i'
    );
    bio = bio.replace(bylineRe, '').trimEnd();
  }
  return bio;
}
