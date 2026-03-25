import type { SanityEvent } from './sanity';

export type Event = SanityEvent;

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
export const HIDDEN_SLUGS = new Set([
  'self-funded-residency-program',
  'linh-le',
  'post-vidai',
]);

export const categories = [
  '+a.Farm',
  '+1 contemporary project',
  '+1 performance',
  '+1 nice place for experimentation',
  'MoTsound',
  'MoT+++',
] as const;

/** Returns true if the event's date is in the past */
export function isPast(event: Event): boolean {
  const d = event.sortDate || event.dateISO;
  return d < new Date().toISOString().slice(0, 10);
}

/** Filter events to the public listing (no bio pages, no hidden, no VN mirrors) */
export function getListingEvents(events: Event[]): Event[] {
  return events
    .filter(e => !BIO_SLUGS.has(e.slug) && !HIDDEN_SLUGS.has(e.slug) && !e.slug.endsWith('-vn') && !e.isBioPage)
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

/** Previous and next events in the listing (newest-first order) */
export function getAdjacentEvents(slug: string, listingEvents: Event[]): { prev: Event | null; next: Event | null } {
  const idx = listingEvents.findIndex(e => e.slug === slug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? listingEvents[idx - 1] : null,
    next: idx < listingEvents.length - 1 ? listingEvents[idx + 1] : null,
  };
}

/** For a given event, find bio entries whose artist name appears in the event's title/slug */
export function getRelatedResidents(event: Event, allEvents: Event[]): Event[] {
  return allEvents
    .filter(bio => BIO_SLUGS.has(bio.slug) || bio.isBioPage)
    .filter(bio => {
      const nameParts = bio.title.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
      const haystack = (event.title + ' ' + event.slug).toLowerCase();
      return nameParts.some(w => haystack.includes(w));
    });
}

/** For a given resident bio, find real events that mention the artist */
export function getRelatedEvents(bio: Event, allEvents: Event[]): Event[] {
  const nameParts = bio.title.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
  return getListingEvents(allEvents)
    .filter(event => {
      const haystack = (event.title + ' ' + event.slug).toLowerCase();
      return nameParts.some(w => haystack.includes(w));
    })
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
