/** Single source of truth for outbound contact addresses.
 *
 *  Keys are named by INTENT (which team owns the lead), not by today's inbox,
 *  so a routing change is one line here and no consumer changes: every call
 *  site imports an intent-named key, never a literal.
 *
 *  All addresses below are verified send-as aliases on the info@ mailbox
 *  (Workspace, checked 2026-09-07). `press` deliberately points at info@:
 *  there is no press@ alias. If one is created later, change that line only.
 *
 *  Must stay dependency-free (no Sanity client import) so client components
 *  and plain data modules can import it.
 */
export const CONTACTS = {
  general:   "info@motplusplusplus.com",
  sales:     "sales@motplusplusplus.com",    // +1 trash inquiries
  museum:    "museum@motplusplusplus.com",   // +1 museum
  residency: "afarm@motplusplusplus.com",    // a.Farm
  press:     "info@motplusplusplus.com",     // no press@ alias exists
} as const;

export type ContactKey = keyof typeof CONTACTS;
