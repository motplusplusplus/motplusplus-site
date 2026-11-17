/** House-style photographer credit: "photo: <name>", lowercase except the
 *  protected brand spellings (MoT+++, a.Farm, MoTsound, MoTcyclopedia).
 *  Returns null when there is no usable name, so callers render nothing.
 *  Lowercasing is Unicode-aware but a no-op for scripts without case
 *  (e.g. 蔣壽安). */
const PROTECTED: [RegExp, string][] = [
  [/mot\+\+\+/gi, "MoT+++"],
  [/\ba\.farm\b/gi, "a.Farm"],
  [/\bmotsound\b/gi, "MoTsound"],
  [/\bmotcyclopedia\b/gi, "MoTcyclopedia"],
];

export function photoCreditText(name: string | null | undefined): string | null {
  const n = (name ?? "").trim().replace(/\s+/g, " ");
  if (!n) return null;
  let out = n.toLowerCase();
  for (const [re, canon] of PROTECTED) out = out.replace(re, canon);
  return `photo: ${out}`;
}
