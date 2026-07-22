/** Single source of truth for outbound contact addresses.
 *
 *  Keys are named by INTENT (which team owns the lead), not by today's inbox.
 *  Right now several intents collapse onto the same gmail; that is expected.
 *
 *  When Google Workspace lands, update ONLY this file — one line per address,
 *  no consumer changes are needed because every call site imports the
 *  intent-named key, never a literal:
 *    general   → hello@motplusplusplus.com
 *    sales     → sales@motplusplusplus.com
 *    museum    → museum@motplusplusplus.com
 *    residency → residency@motplusplusplus.com
 *    press     → press@motplusplusplus.com
 *
 *  Must stay dependency-free (no Sanity client import) so client components
 *  and plain data modules can import it.
 */
export const CONTACTS = {
  general:   "motplusplusplus@gmail.com",
  sales:     "motplusplusplus@gmail.com",   // +1 trash inquiries
  museum:    "motplusplusplus@gmail.com",
  residency: "a.farm.saigon@gmail.com",
  press:     "motplusplusplus@gmail.com",
} as const;

export type ContactKey = keyof typeof CONTACTS;
