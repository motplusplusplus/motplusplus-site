import type { CEvent, Img } from './catalogue';
import { fold } from './fold';

/** The compact shape the events index and the event page's bottom rows need. */
export type EventEntry = {
  slug: string; title: string; vnTitle: string | null;
  start: string; end: string | null; displayDate: string; year: number;
  category: string; venue: string; venueAddress: string | null; mapUrl: string | null;
  line: string; cover: Img | null; people: string;
};

const firstLine = (s: string) => {
  const t = (s || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();
  if (t.length <= 150) return t;
  const cut = t.slice(0, 150);
  const dot = cut.search(/[.!?]\s[^.!?]*$/);
  return dot > 60 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…';
};

export function toEntry(e: CEvent): EventEntry {
  return {
    slug: e.slug, title: e.title, vnTitle: e.vnTitle ?? null,
    start: e.dateISO, end: e.endDateISO ?? null, displayDate: e.displayDate, year: e.year,
    category: e.category, venue: e.whereLabel ?? e.venue?.name ?? e.location ?? '',
    venueAddress: e.venue ? [e.venue.address, e.venue.city].filter(Boolean).join(', ') : (e.location || null),
    mapUrl: e.venue?.mapUrl ?? null,
    line: firstLine(e.description), cover: e.cover,
    people: e.credits.map(c => c.person.name).join(', '),
  };
}

/** Folded search text: titles (EN and VN), people, venue, descriptions (E6, S5). */
export function searchText(e: CEvent): string {
  return fold([e.title, e.vnTitle, e.credits.map(c => c.person.name).join(' '), e.whereLabel, ...e.venues.flatMap(v => [v.name, v.address]), ...e.pastVenues.flatMap(p => [p.venue.name, p.venue.address]), e.location, e.category, e.description, e.vnDescription].filter(Boolean).join(' ')).replace(/\s+/g, ' ');
}
