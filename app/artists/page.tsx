import { getArtists } from '@/lib/sanity';
import ArtistsShell, { type ArtistEntry } from './ArtistsShell';

export default async function ArtistsPage() {
  const raw = await getArtists();

  const artists: ArtistEntry[] = raw.map((a: any) => ({
    slug: a.slug,
    name: a.name,
    isAfarmResident: a.isAfarmResident ?? false,
  }));

  return <ArtistsShell artists={artists} />;
}
