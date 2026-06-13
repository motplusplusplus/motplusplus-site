// ─── Profile badge taxonomy ───────────────────────────────────────────────────
// Single source of truth for who gets which badge. Badges are DERIVED at build
// time from existing signals (Sanity `role` / `residencyStartDate` / event refs,
// JSON flags, and the curated sets below) — there is no Sanity enum field.

/** Current a.Farm studio hosts. nguyen-thuy-hang confirmed active host (2026-06). */
export const HOSTING_SLUGS = new Set([
  "andrew-newell-walther", "karlie-ho", "le-phi-long", "quoc-anh-le",
  "hoang-nam-viet", "nguyen-thuy-hang", "thom-nguyen",
]);

/** MoT+++ collective members — authoritative list is the /collective page (7). */
export const COLLECTIVE_SLUGS = new Set([
  "aliansyah-caniago", "cam-xanh", "cian-duggan", "kim-duy",
  "le-phi-long", "matthew-brannon", "wu-chi-tsung",
]);

/** Founder / director — Cam Xanh only (Sanity role "Founder"). */
export const FOUNDER_SLUGS = new Set(["cam-xanh"]);

// +1 residency — pre-2018 MoT+++ residents, manually curated. The data does NOT
// cleanly identify these: "+1 a nice place for experimentation" is a 2017–2025
// program series (presenters, not residents) and no bio/record says "+1 residency".
// Uncertain candidates exhibited in the "+1 museum by any other name" collection
// (NOT confirmed residents): "dao-tung", "tran-minh-duc". Populate as confirmed.
export const PLUS1_RESIDENCY_SLUGS = new Set<string>([]);

// +1 museum — artists with work placed in the decentralized "+1 museum by any
// other name" collection (Sanity museumLocation docs with an artistRef).
// populated when museumLocation artist refs exist in Sanity — currently empty
export const PLUS1_MUSEUM_SLUGS = new Set<string>([]);

/** Sanity `role` values that denote a non-artist primary identity. */
const CURATOR_ROLES = new Set(["curator", "writer", "researcher"]);

const norm = (r?: string | null) => (r || "").trim().toLowerCase();

/** Returns "curator" | "writer" | "researcher" if the Sanity role matches, else null. */
export function roleCategory(role?: string | null): string | null {
  const r = norm(role);
  return CURATOR_ROLES.has(r) ? r : null;
}

// ─── JSON-flag → Sanity migration status (audited 2026-06-14, ISSUE-006) ──────────
// computeBadges still depends on three artists-data.json flags because Sanity does NOT
// yet reliably cover them. Verified by cross-referencing every JSON flag against live
// Sanity (`role` / `residencyStartDate` / `isAfarmResident`):
//   • resident        — 72 JSON-flagged; 60 covered by Sanity, but 12 have NO Sanity
//                       residencyStartDate AND no isAfarmResident: perrine-lievens,
//                       celina-huynh, lai-dieu-ha, maxime-brygo, phuong-gio,
//                       bang-nhat-linh, ngo-thanh-bac, weston-teruya, baby-reni,
//                       enkhbold-togmidshiirev, lap-xuan, duong-tu-que. Dropping the
//                       JSON fallback would remove their a.Farm badge → KEEP until those
//                       12 get a residencyStartDate (or isAfarmResident) set in Sanity.
//   • performancePlus — 43 JSON-flagged; Sanity has NO equivalent field at all → KEEP
//                       until a Sanity boolean (e.g. isPerformancePlus) is added (§ISSUE-005-ish).
//   • curator         — 3 JSON-flagged (karlie-ho, linh-le, david-willis); Sanity `role`
//                       covers linh-le + david-willis, but karlie-ho's Sanity role is
//                       empty and her curator status can't be independently verified →
//                       KEEP until her Sanity role is set.
// Retire each flag from the assembly sites (app/profiles/page.tsx and
// app/profiles/[slug]/page.tsx) only AFTER the matching Sanity gap above is closed.
export type PersonSignals = {
  slug: string;
  role?: string | null;        // Sanity free-text role (JSON `curator` flag is the fallback — see audit above)
  hasResidency: boolean;       // defined(residencyStartDate) || isAfarmResident || JSON resident (12 rely only on JSON)
  isPerformancePlus: boolean;  // JSON performancePlus only — no Sanity field exists
  motsoundEditions?: number[]; // editions performed at (from Sanity event refs — fully Sanity-sourced)
};

export type BadgeResult = {
  primary: string;        // single primary identity (listing sub-label + grouping)
  isFounder: boolean;     // for red founder styling
  isPlus1Museum: boolean; // has work in the +1 museum collection
  filters: string[];      // every filter tag this person matches
  bioBadges: string[];    // ordered badges for the bio-page hero
};

export function computeBadges(p: PersonSignals): BadgeResult {
  const isHost = HOSTING_SLUGS.has(p.slug);
  const isFounder = FOUNDER_SLUGS.has(p.slug);
  const isCollective = COLLECTIVE_SLUGS.has(p.slug);
  const isPlus1Residency = PLUS1_RESIDENCY_SLUGS.has(p.slug);
  const isPlus1Museum = PLUS1_MUSEUM_SLUGS.has(p.slug);
  const editions = p.motsoundEditions ?? [];
  const roleCat = roleCategory(p.role);

  // Primary identity, highest priority first.
  let primary = "artist";
  if (isFounder) primary = "founder/director";
  else if (isHost) primary = "hosting artist";
  else if (roleCat && !p.hasResidency) primary = roleCat;       // curator/writer/researcher
  else if (p.hasResidency) primary = "a.Farm";
  else if (isPlus1Residency) primary = "+1 residency";
  else if (p.isPerformancePlus) primary = "+1 performance";

  // Filterable tags — a person can match several.
  const filters: string[] = [];
  if (isFounder) filters.push("founder/director");
  if (isHost) filters.push("hosting artist");
  if (p.hasResidency) filters.push("a.Farm");
  if (isPlus1Residency) filters.push("+1 residency");
  if (isPlus1Museum) filters.push("+1 museum");
  if (p.isPerformancePlus) filters.push("+1 performance");
  if (editions.length) filters.push("MoTSound");
  if (roleCat) filters.push(roleCat);
  if (isCollective) filters.push("+1 collective");

  // Bio-page badges (ordered). +1 collective shows here, not on the listing card.
  const bioBadges: string[] = [];
  if (isFounder) bioBadges.push("founder/director");
  if (isHost) bioBadges.push("hosting artist");
  if (p.hasResidency) bioBadges.push("a.Farm resident");
  if (isPlus1Residency) bioBadges.push("+1 residency");
  if (isPlus1Museum) bioBadges.push("+1 museum");
  if (p.isPerformancePlus) bioBadges.push("+1 performance");
  for (const n of editions) bioBadges.push(`MoTSound #${n}`);
  if (roleCat) bioBadges.push(roleCat);
  if (isCollective) bioBadges.push("+1 collective");

  return { primary, isFounder, isPlus1Museum, filters, bioBadges };
}
