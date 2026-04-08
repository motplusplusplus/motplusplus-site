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
  "vicente-arrese","pug-alex-williams","lau-wang-tat","narelle-zhao",
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
  "weston-teruya",
  // +1 residency artists (performance plus 2018–2019)
  "enkhbold-togmidshiirev","ngo-thanh-bac","lap-xuan",
  // artists (MoT+++ collaborators with bio pages)
  "tran-minh-duc",
  // curators
  "linh-le",
  // artists & collectives with event appearances
  "nhan-phan","yui-nguyen","tran-uy-duc","montez-press","lyon-nguyen",
  "song-nguyen","bert-nguyen-san",
]);

/** Slugs to hide from all public listings */
export const HIDDEN_SLUGS = new Set([
  'self-funded-residency-program',
  'post-vidai',
  // Duplicate slugs — images merged into canonical counterpart
  'mot-sound-8-amoeba-2',
  'nuoc-water-resistance-a-solo-exhibition-by-thom-nguyen',
  'giua-nhung-chop-bong-toi-mo-tiep-nhung-giac-mo-in-between-frames-i-dream-the-dreams-i-have-been-dreaming',
  'codesurfing', // merged into codesurfing-a-search-for-a-poetical-technology-a-talk-by-nhan-phan-yui-nguyen
  'talk-discussion-cung-tro-chuyen', // merged into the-calligraphic-regimes-of-contemporary-vietnamese-art-a-reading-discussion-with-pamela-n-corey
  // -vn duplicates — vnDescription merged into canonical
  'all-animals-are-equal-1-vn',
  'it-seems-to-be-dao-tung-vn',
  'minimal-prayer-duy-nguyen-vn',
  'mot-doi-gai-a-beach-life-cam-xanh-vn',
  'mot-sound-10-anoise-vn',
  'mot-sound-11-adom-vn',
  'mot-sound-15-arenaissance-vn',
  'mot-sound-16-poetry-plus-vol-3-vn',
  'mot-sound-5-vn',
  'mot-sound-6-vn',
  'mot-sound-9-aconvergence-vn',
  'othermother-cian-duggan-vn',
  'tuan-mami-amp-cam-xanh-artist-presentations-performance-plus-2019-vn',
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

// Generic art-world words that must not serve as sole match identifiers
const MATCH_BLOCKLIST = new Set([
  'studio', 'open', 'with', 'from', 'work', 'artist', 'residency',
  'workshop', 'talk', 'film', 'reading', 'screening', 'performance',
  'discussion', 'exhibition', 'event', 'session', 'practice', 'project',
  'gallery', 'space', 'collective', 'center', 'centre', 'house', 'room',
  // Common Vietnamese words that appear in event titles/slugs
  'chung', // viết chung = "write together"; would falsely match Lê Đ. Chung
  // Extremely common Vietnamese surname/given name parts — too ambiguous to use as match keys.
  // RULE: never use single common name parts as match identifiers; full name matching only.
  'nguyen', // most common Vietnamese surname; appears in nearly every event description
  'tran',   // common surname; also appears inside English words: "transcend", "translate"
  'minh',   // very common given name; appears in "Ho Chi Minh", "Hoàng Tường Minh", etc.
  'linh',   // very common given name; appears in "Bang Nhat Linh", "Phuong Linh", slug fragments
  'phuong', // common given name (Phương); also means "ward/direction" in Vietnamese text
  'thanh',  // common name part; appears in many Vietnamese descriptions and artist names
  'trang',  // common name part (Trang); appears in event slugs and Vietnamese text
  'hong',   // common Vietnamese name (Hồng); also appears in "Hong Kong" in descriptions
  'song',   // common English word ("a song of…") and Vietnamese surname
  'bert',   // short name; "bert" appears in Bert Ackley events, causing false Bert Nguyễn San matches
  // Common English words that happen to be artist surnames
  'strange', // Ian Strange — "strange" appears as an adjective in many event descriptions
]);

/**
 * True single-word artist names that are genuinely unique and may be matched on their own.
 * MUST be explicitly listed here; all other artists require ≥2 significant name parts.
 */
const SINGLE_NAME_WHITELIST = new Set(['kaki', 'coco', 'yeonjeong']);

function matchParts(title: string): string[] {
  const parts = title.toLowerCase().split(/\s+/)
    .filter(w => w.length >= 4 && !MATCH_BLOCKLIST.has(w));
  // PERMANENT RULE: full-name matching only.
  // Require at least 2 significant parts unless the name is a whitelisted unique single word.
  // This prevents any single common word (linh, phuong, song, bert, …) from triggering a match.
  if (parts.length <= 1) {
    if (parts.length === 1 && SINGLE_NAME_WHITELIST.has(parts[0])) return parts;
    return [];
  }
  return parts;
}

/** For a given event, find bio entries whose artist name appears in the event's title/slug/description */
export function getRelatedResidents(event: Event, allEvents: Event[]): Event[] {
  return allEvents
    .filter(bio => BIO_SLUGS.has(bio.slug) || bio.isBioPage)
    .filter(bio => {
      const nameParts = matchParts(bio.title);
      if (nameParts.length === 0) return false;
      const titleSlug = (event.title + ' ' + event.slug).toLowerCase();
      if (nameParts.every(w => titleSlug.includes(w))) return true;
      // Also check description, but only when at least one name part is ≥6 chars (distinctive enough).
      // Two short 4-5 char parts can both appear in unrelated descriptions → only title/slug for those.
      const safeToCheckDesc = nameParts.some(w => w.length >= 6);
      if (!safeToCheckDesc) return false;
      const desc = (event.description || '').toLowerCase();
      return nameParts.every(w => desc.includes(w));
    });
}

/** For a given resident bio, find real events that mention the artist */
export function getRelatedEvents(bio: Event, allEvents: Event[]): Event[] {
  const nameParts = matchParts(bio.title);
  if (nameParts.length === 0) return [];
  const safeToCheckDesc = nameParts.some(w => w.length >= 6);
  return getListingEvents(allEvents)
    .filter(event => {
      const titleSlug = (event.title + ' ' + event.slug).toLowerCase();
      if (nameParts.every(w => titleSlug.includes(w))) return true;
      if (!safeToCheckDesc) return false;
      const desc = (event.description || '').toLowerCase();
      return nameParts.every(w => desc.includes(w));
    })
    .sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}
