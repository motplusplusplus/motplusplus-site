// artist.disciplines (2026-11-22). IDENTICAL COPY of DISCIPLINES in the Studio repo
// (motplus-sanity/schemaTypes/lib/disciplines.ts): change both together. Labels are
// site chrome, so lowercase except "DJ". Client-safe, no imports.
export const DISCIPLINE_LABELS: Record<string, string> = {
  painter: 'painter',
  drawer: 'drawer',
  sculptor: 'sculptor',
  installation: 'installation',
  textile: 'textile',
  photography: 'photography',
  'video-digital': 'video / digital',
  'sound-music': 'sound / music',
  dj: 'DJ',
  performance: 'performance',
  writer: 'writer',
  poet: 'poet',
  curator: 'curator',
  researcher: 'researcher',
  critic: 'critic',
  architect: 'architect',
};
export const DISCIPLINE_ORDER = Object.keys(DISCIPLINE_LABELS);
