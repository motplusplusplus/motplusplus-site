/** Single source of truth for outbound contact addresses.
 *
 *  Keys are named by INTENT (which team owns the lead), not by today's inbox.
 *  Several intents may collapse onto one address; that is expected and keeps
 *  a later split a one-line change here, with no consumer edits.
 *
 *  Routing by section (2026-09-07 — Google Workspace is live on
 *  motplusplusplus.com; MX + SPF confirmed):
 *    a.Farm pages  → afarm@   (/afarm/*, /links a.farm form, /contact)
 *    +1 Trash      → sales@   (/trash, /trash/[slug])
 *    +1 Museum     → museum@  (/museum, /museum/inquire, map locations)
 *    everything else → info@  (footer, /contact, /sound, /advisory,
 *                              /directexperience, /links, /press, JSON-LD)
 *
 *  `press` is deliberately kept as its own key even though it currently points
 *  at info@ — /press can be split back out later by editing only this line.
 *
 *  Must stay dependency-free (no Sanity client import) so client components
 *  and plain data modules can import it.
 */
export const CONTACTS = {
  general:   "info@motplusplusplus.com",
  sales:     "sales@motplusplusplus.com",    // +1 trash inquiries
  museum:    "museum@motplusplusplus.com",   // +1 museum locations
  residency: "afarm@motplusplusplus.com",    // a.Farm residency + studios
  press:     "info@motplusplusplus.com",     // folded into general for now
} as const;

export type ContactKey = keyof typeof CONTACTS;
