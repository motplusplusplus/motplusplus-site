import { getArtists } from '@/lib/sanity';
import { artistsFromData } from '@/lib/artists';
import ArtistsShell, { type ArtistEntry } from './ArtistsShell';

export default async function ArtistsPage() {
  const sanityRaw = await getArtists();
  const sanitySlugSet = new Set(sanityRaw.map((a: any) => a.slug as string));

  const sanityArtists: ArtistEntry[] = sanityRaw.map((a: any) => ({
    slug: a.slug,
    name: a.name,
    isAfarmResident: a.isAfarmResident ?? false,
  }));

  // Artists in artists-data.json that aren't in Sanity
  const jsonOnlyArtists: ArtistEntry[] = artistsFromData
    .filter(a => !sanitySlugSet.has(a.slug))
    .map(a => ({
      slug: a.slug,
      name: a.name,
      isAfarmResident: a.resident,
    }));

  const artists = [...sanityArtists, ...jsonOnlyArtists]
    .sort((a, b) => a.name.localeCompare(b.name));

  return <ArtistsShell artists={artists} />;
}
