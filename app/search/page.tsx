import { Suspense } from "react";
import { getArtists, getAllEvents } from "@/lib/sanity";
import { getAllStudios } from "@/lib/studios";
import { artistsFromData, CONSOLIDATED_BIO_SLUGS } from "@/lib/artists";
import { BIO_SLUGS, HIDDEN_SLUGS } from "@/lib/events";
import { compareNames } from "@/lib/sortName";
import SearchShell, { type ArtistResult, type StudioResult, type EventResult } from "./SearchShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  alternates: { canonical: "https://motplusplusplus.com/search" },
};

export default async function SearchPage() {
  // Artists: merge Sanity + JSON
  const sanityRaw = await getArtists();
  const sanitySlugSet = new Set(sanityRaw.map((a: any) => a.slug as string));

  const sanityArtists: ArtistResult[] = sanityRaw.map((a: any) => ({
    slug: a.slug,
    name: a.name,
    alternateNames: a.alternateNames ?? [],
    hasBio: BIO_SLUGS.has(a.slug),
  }));

  // Excludes CONSOLIDATED_BIO_SLUGS -- old/retired slugs merged into a
  // canonical profile elsewhere (e.g. baby-reni -> irene-ha); without this
  // filter they show as a second, broken-linking result alongside the real one
  // (same bug as app/profiles/page.tsx, see ISSUE-015).
  const jsonOnlyArtists: ArtistResult[] = artistsFromData
    .filter(a => !sanitySlugSet.has(a.slug) && !CONSOLIDATED_BIO_SLUGS.has(a.slug))
    .map(a => ({
      slug: a.slug,
      name: a.name,
      hasBio: BIO_SLUGS.has(a.slug),
    }));

  const artists = [...sanityArtists, ...jsonOnlyArtists].sort((a, b) =>
    compareNames(a.name, b.name)
  );

  // Studios: active, visible
  const allStudios = await getAllStudios();
  const studios: StudioResult[] = allStudios
    .filter(s => s.active && !s.hidden)
    .map(s => ({ slug: s.slug, name: s.name, neighborhood: s.neighborhood }));

  // Events: Sanity-sourced (events-data.json is a legacy archive, all events
  // are migrated -- see RESOLVED-003), same exclusion filter as app/sitemap.ts's
  // eventPages so /search never links to a slug generateStaticParams excludes.
  // Previously imported events-data.json directly with NO filtering at all --
  // 36 bio-page event slugs (including cam-xanh, aliansyah-caniago) genuinely
  // 404'd when clicked from search results (see ISSUE-015).
  const allEvents = await getAllEvents();
  const events: EventResult[] = allEvents
    .filter(e => !HIDDEN_SLUGS.has(e.slug) && !e.slug.endsWith('-vn') && !BIO_SLUGS.has(e.slug) && !e.isBioPage)
    .map(e => ({
      slug: e.slug,
      title: e.title,
      displayDate: e.displayDate ?? "",
    }));

  return (
    <Suspense>
      <SearchShell artists={artists} studios={studios} events={events} />
    </Suspense>
  );
}
