import { getArtists } from '@/lib/sanity';
import { artistsFromData } from '@/lib/artists';
import { BIO_SLUGS } from '@/lib/events';
import ArtistsShell, { type ArtistEntry } from './ArtistsShell';

const HOSTING_SLUGS = new Set([
  "andrew-newell-walther","karlie-ho","le-phi-long","quoc-anh-le",
  "hoang-nam-viet","nguyen-thuy-hang","thom-nguyen",
]);

// JSON is authoritative for resident status — Sanity isAfarmResident is often not set
const jsonResidentSlugs = new Set(artistsFromData.filter(a => a.resident).map(a => a.slug));

export default async function ArtistsPage() {
  const sanityRaw = await getArtists();
  const sanitySlugSet = new Set(sanityRaw.map((a: any) => a.slug as string));

  const sanityArtists: ArtistEntry[] = sanityRaw.map((a: any) => {
    const isHost = HOSTING_SLUGS.has(a.slug);
    const isResident = !isHost && (a.isAfarmResident || jsonResidentSlugs.has(a.slug));
    return {
      slug: a.slug,
      name: a.name,
      isAfarmResident: isResident,
      isHostingArtist: isHost,
      bioPage: BIO_SLUGS.has(a.slug) || isHost,
    };
  });

  // Artists in artists-data.json that aren't in Sanity
  const jsonOnlyArtists: ArtistEntry[] = artistsFromData
    .filter(a => !sanitySlugSet.has(a.slug))
    .map(a => {
      const isHost = a.studioHost || HOSTING_SLUGS.has(a.slug);
      return {
        slug: a.slug,
        name: a.name,
        isAfarmResident: a.resident && !isHost,
        isHostingArtist: isHost,
        bioPage: BIO_SLUGS.has(a.slug) || isHost,
      };
    });

  const artists = [...sanityArtists, ...jsonOnlyArtists]
    .sort((a, b) => a.name.localeCompare(b.name));

  return <ArtistsShell artists={artists} />;
}
