// EXCLUDED PEOPLE (CLAUDE.md): Luke Schneider and Nguyễn Trà My are never credited or
// listed on this site. The data should not contain them at all; this is a defensive
// read-time filter for pages that list people, so a record created by mistake still
// never renders. MIRRORS isExcludedPerson() in the Studio repo
// (motplus-sanity/lib/excludedPeople.ts, the canonical, tested version): same forms,
// same homonym allowlist. Change both together.

function normalizeName(input: string): string {
  return String(input ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const EXCLUDED_FORMS = [
  "luke schneider", "schneider luke",
  "nguyen tra my", "tra my nguyen", "my tra nguyen", "nguyen my tra",
  "tra my", "my nguyen", "nguyen my",
];

// Ngô Trà My, a Đàn Bầu musician, is a different person (see the Studio copy).
const HOMONYM_ALLOWLIST = ["ngo tra my"];

export function isExcludedPerson(name: string): boolean {
  const n = normalizeName(name);
  if (!n || HOMONYM_ALLOWLIST.includes(n)) return false;
  return EXCLUDED_FORMS.some((f) => ` ${n} `.includes(` ${f} `));
}
