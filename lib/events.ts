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
  vnTitle?:       string;   // Vietnamese title for bilingual display
  vnDescription?: string;   // Vietnamese description for bilingual display
  videoUrl?:      string;   // YouTube or other video embed URL
};

export const allEvents: Event[] = eventsRaw as Event[];

/** Slugs that are resident bio pages (not event announcements) */
export const BIO_SLUGS = new Set([
  "boynton-yue","michael-atavar","tam-do","ru-marshall",
  "noah-spivak","juan-leduc-riley","kaki","nguyen-giao-xuan","van-anh-le",
  "coco","lai-minh-ngoc","le-d-chung","ania-reynolds","anh-tran",
  "linh-vh-nguyen","shiro-masuyama","thom-nguyen","ian-strange",
  "exxonnubile-julia-weiner","x-o-veron-xio","aylin-derya-stahl",
  "virginie-tan","baby-reni","irene-ha","duy-nguyen","nguyen-hoa",
  "vicente-arrese","alex-williams","lau-wang-tat","narelle-zhao",
  "annabelle-yep","linh-san","damon-duc-pham","mascha-serga","blake-palmer",
  "david-willis","laura-philips","anh-vo","chau-kim-sanh","bert-ackley",
  "espen-iden","kayla-kurin","claire-bloomfield","yeonjeong","saverio-tonoli",
  "ly-trang","chu-hao-pei","nghia-dang","lan-anh-le","matteo-biella",
  "tina-thu","kanich-khajohnsri","levi-masuli","eden-barrena","rachel-tonthat",
  "nguyen-le-phuong-linh","roberto-sifuentes","aram-han-sifuentes",
  "natalia-ludmila","z1-studio","constance-meffre","mariana-tubio-blasio",
  "matthew-brannon","scott-anderson","cora-von-zezschwitz-tilman-hoepfl",
  "scott-farrand","latthapon-korkiatarkul","luca-lum","nguyen-duc-phuong",
  "cian-duggan","john-edmond-smyth","kim-duy","tram-luong",
  "tricia-nguyen-thanh-trang","bagus-mazasupa-anwarridwan","maung-day",
  "ben-valentine","tuyen-nguyen","alisa-chunchue","karen-thao-nguyen-la",
  "lem-trag","wu-chi-tsung",
]);

/** Slugs to hide from all public listings */
export const HIDDEN_SLUGS = new Set(['self-funded-residency-program']);

/** Events shown in the public listing — excludes Vietnamese-language duplicate pages */
export const publicEvents: Event[] = allEvents.filter(e => !e.slug.endsWith('-vn'));

/** Events shown in the main listing — excludes bio pages and hidden entries, sorted newest first */
export const listingEvents: Event[] = publicEvents
  .filter(e => !BIO_SLUGS.has(e.slug) && !HIDDEN_SLUGS.has(e.slug))
  .sort((a, b) => b.sortDate.localeCompare(a.sortDate));

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

/** Previous and next events in the listing (newest-first order) */
export function getAdjacentEvents(slug: string): { prev: Event | null; next: Event | null } {
  const idx = listingEvents.findIndex(e => e.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? listingEvents[idx - 1] : null,           // newer
    next: idx < listingEvents.length - 1 ? listingEvents[idx + 1] : null, // older
  };
}

/** For a given event, find bio entries whose artist name appears in the event's title/slug */
export function getRelatedResidents(event: Event): Event[] {
  return allEvents
    .filter(bio => BIO_SLUGS.has(bio.slug))
    .filter(bio => {
      const nameParts = bio.title.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
      const haystack = (event.title + ' ' + event.slug).toLowerCase();
      return nameParts.some(w => haystack.includes(w));
    });
}

/** For a given resident bio, find real events that mention the artist */
export function getRelatedEvents(bio: Event): Event[] {
  const nameParts = bio.title.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
  return listingEvents
    .filter(event => {
      const haystack = (event.title + ' ' + event.slug).toLowerCase();
      return nameParts.some(w => haystack.includes(w));
    })
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
