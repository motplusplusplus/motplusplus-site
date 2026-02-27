import eventsRaw from '../events-data.json';

export type Event = {
  slug:        string;
  title:       string;
  displayDate: string;
  dateISO:     string;
  sortDate:    string;   // actual event date (extracted from displayDate); used for ordering
  pubDate:     string;
  category:    string;
  location:    string;
  description: string;
  images:      string[];
  thumbnail:   string;
  wpLink:      string;
};

export const allEvents: Event[] = eventsRaw as Event[];

export const categories = [
  '+a.farm',
  '+1 contemporary project',
  '+1 performance',
  '+1 nice place for experimentation',
  'MoTsound',
] as const;

export function getEvent(slug: string): Event | undefined {
  return allEvents.find(e => e.slug === slug);
}

export function getEventSlugs(): string[] {
  return allEvents.map(e => e.slug);
}

/** Returns true if the event's actual date is in the past */
export function isPast(event: Event): boolean {
  const d = event.sortDate || event.dateISO;
  return d < new Date().toISOString().slice(0, 10);
}
