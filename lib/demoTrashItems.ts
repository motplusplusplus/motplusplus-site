import { CONTACTS } from './contacts';

export type ArtistCredit = { _id: string; name: string; slug: string | null };

export type TrashItem = {
  _id: string;
  artist: string;
  artistSlug?: string | null;   // single artistRef slug — links the name when artists[] is empty
  artists?: ArtistCredit[];     // resolved artists[] refs — may be empty/unresolved
  slug?: string;                // links to /trash/[slug]
  title: string;
  medium: string;
  year: number;
  dimensions: string;
  edition: string;
  description: string;
  images: string[];
  youtubeUrls?: string[];      // YouTube embed URLs, rendered on /trash/[slug] only
  museumLocationId?: string;   // links to a museum location _id
  neighbourhood?: string;      // neighbourhood of museum placement
  sold?: boolean;
  price?: string;              // internal — not rendered unless unlocked
  orderIndex?: number;         // index in canonical Sanity order — "date added" sort key on /trash
  cardImageIndex?: number;     // build-time image pick for the /trash grid card
};

/** Joined artist credit, e.g. "A & B" for a collaborative work, falling back
 *  to the plain display string when artists[] is empty or unresolved. */
export function artistLabelFor(item: { artist: string; artists?: ArtistCredit[] }): string {
  const names = (item.artists ?? []).filter(Boolean).map(a => a.name);
  return names.length > 0 ? names.join(' & ') : item.artist;
}

/** Pre-populated mailto inquiry link, shared by the /trash lightbox and /trash/[slug] pages */
export function buildTrashInquiryEmail(item: TrashItem) {
  const subject = encodeURIComponent(
    `+1 trash inquiry: ${item.title} by ${item.artist}`
  );
  const body = encodeURIComponent(
    `Hello,\n\nI am writing to inquire about the following work:\n\n` +
    `Artist: ${item.artist}\n` +
    `Title: ${item.title}\n` +
    `Medium: ${item.medium}\n` +
    `Year: ${item.year}\n` +
    (item.dimensions ? `Dimensions: ${item.dimensions}\n` : '') +
    (item.edition ? `Edition: ${item.edition}\n` : '') +
    `\nI would like to learn more about its availability and price.\n\nThank you.`
  );
  return `mailto:${CONTACTS.sales}?subject=${subject}&body=${body}`;
}
