import type { Metadata } from 'next';
import { getArtists, getMotsoundPerformerEditions } from '@/lib/sanity';
import { artistsFromData, CONSOLIDATED_BIO_SLUGS } from '@/lib/artists';
import { computeBadges } from '@/lib/badges';
import { compareNames } from '@/lib/sortName';
import ArtistsShell, { type ArtistEntry } from './ArtistsShell';

const jsonBySlug = new Map(artistsFromData.map(a => [a.slug, a]));
// JSON is authoritative for resident status — Sanity isAfarmResident is often not set
const jsonResidentSlugs = new Set(artistsFromData.filter(a => a.resident).map(a => a.slug));

export const metadata: Metadata = {
  alternates: { canonical: 'https://motplusplusplus.com/profiles' },
};

export default async function ArtistsPage() {
  const [sanityRaw, motsound] = await Promise.all([
    getArtists(),
    getMotsoundPerformerEditions(),
  ]);
  const sanitySlugSet = new Set(sanityRaw.map((a: any) => a.slug as string));

  const sanityArtists: ArtistEntry[] = sanityRaw.map((a: any) => {
    const json = jsonBySlug.get(a.slug);
    // a.Farm membership is driven by residencyStartDate (reliable) rather than the
    // often-unset isAfarmResident boolean; JSON resident flag is the final fallback.
    const hasResidency = !!a.residencyStartDate || !!a.isAfarmResident || jsonResidentSlugs.has(a.slug);
    const b = computeBadges({
      slug: a.slug,
      role: a.role,
      hasResidency,
      isPerformancePlus: !!json?.performancePlus,
      motsoundEditions: motsound[a.slug],
    });
    return { slug: a.slug, name: a.name, alternateNames: a.alternateNames ?? [], primary: b.primary, isFounder: b.isFounder, filters: b.filters };
  });

  // Artists in artists-data.json that aren't in Sanity. Excludes
  // CONSOLIDATED_BIO_SLUGS -- these are old/retired slugs merged into a
  // canonical profile elsewhere (e.g. baby-reni -> irene-ha); without this
  // filter they show as a second, broken-linking card alongside the real one.
  const jsonOnlyArtists: ArtistEntry[] = artistsFromData
    .filter(a => !sanitySlugSet.has(a.slug) && !CONSOLIDATED_BIO_SLUGS.has(a.slug))
    .map(a => {
      const b = computeBadges({
        slug: a.slug,
        role: a.curator ? 'curator' : null, // JSON-only curator flag stands in for Sanity role
        hasResidency: a.resident,
        isPerformancePlus: !!a.performancePlus,
        motsoundEditions: motsound[a.slug],
      });
      return { slug: a.slug, name: a.name, primary: b.primary, isFounder: b.isFounder, filters: b.filters };
    });

  const artists = [...sanityArtists, ...jsonOnlyArtists]
    .sort((a, b) => compareNames(a.name, b.name));

  return <ArtistsShell artists={artists} />;
}
