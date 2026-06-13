// Filename stems for logos / brand assets that are never valid event or profile
// images. Single source of truth — was previously duplicated as `JUNK_STEMS`
// (lib/sanity.ts), `SKIP` (app/events/[slug]/page.tsx), and `SKIP_PATTERNS`
// (app/profiles/[slug]/page.tsx). The page lists additionally carried `'logo'`;
// it is included here (a superset is harmless — the pages already filtered it
// downstream, so net output is unchanged).
export const JUNK_IMAGE_STEMS = [
  'a.farmlogo', 'logomot', 's-1-edited', 'amanaki_png', 'artboard',
  'web-e1760', 'web-1-e1760', '3nam-2', 'ajar', 'artrepublik', 'codesurfing',
  'formapubli', 'kirti', 'marg1n', 'matca', 'nbs', 'rr-1', 'vanguard', 'wdg',
  'logo',
];

/** True if the image URL's filename matches a junk/logo stem. */
export function isJunkImage(url: string): boolean {
  const filename = url.split('/').pop()?.toLowerCase() ?? '';
  return JUNK_IMAGE_STEMS.some((stem) => filename.includes(stem));
}
