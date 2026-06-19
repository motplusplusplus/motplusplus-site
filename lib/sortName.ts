// Vietnamese-locale-aware comparator: diacritics fold to their base letter for
// sorting purposes (D-with-stroke sorts with D, U-with-horn sorts with U, etc.) —
// used everywhere artist/person names are alphabetized, so mixed Vietnamese/English
// names interleave the way a reader expects. Display text is never altered.
const collator = new Intl.Collator('vi', { sensitivity: 'base' });

export function compareNames(a: string, b: string): number {
  return collator.compare(a, b);
}

/** Base Latin letter for A-Z grouping headers (e.g. MoTcyclopedia's letter index).
 *  Unicode NFD strips combining diacritics, which covers u-with-horn, o-with-horn,
 *  e-with-circumflex-and-dot-below, a-with-tilde, etc., but D-with-stroke (Đ/đ)
 *  has no canonical decomposition in Unicode — handled as an explicit exception
 *  (verified empirically: 'Đ'.normalize('NFD') === 'Đ', unchanged, unlike
 *  'ư'.normalize('NFD') === 'U' + combining horn U+031B). */
export function groupLetter(name: string): string {
  const ch = (name[0] ?? '').toUpperCase();
  if (ch === 'Đ') return 'D'; // Đ
  return ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
