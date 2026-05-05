import { Suspense } from "react";
import { getArtists } from "@/lib/sanity";
import { getAllStudios } from "@/lib/studios";
import { artistsFromData } from "@/lib/artists";
import { BIO_SLUGS } from "@/lib/events";
import eventsRaw from "@/events-data.json";
import SearchShell, { type ArtistResult, type StudioResult, type EventResult } from "./SearchShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — MoT+++",
};

export default async function SearchPage() {
  // Artists: merge Sanity + JSON
  const sanityRaw = await getArtists();
  const sanitySlugSet = new Set(sanityRaw.map((a: any) => a.slug as string));

  const sanityArtists: ArtistResult[] = sanityRaw.map((a: any) => ({
    slug: a.slug,
    name: a.name,
    hasBio: BIO_SLUGS.has(a.slug),
  }));

  const jsonOnlyArtists: ArtistResult[] = artistsFromData
    .filter(a => !sanitySlugSet.has(a.slug))
    .map(a => ({
      slug: a.slug,
      name: a.name,
      hasBio: BIO_SLUGS.has(a.slug),
    }));

  const artists = [...sanityArtists, ...jsonOnlyArtists].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Studios: active, visible
  const allStudios = await getAllStudios();
  const studios: StudioResult[] = allStudios
    .filter(s => s.active && !s.hidden)
    .map(s => ({ slug: s.slug, name: s.name, neighborhood: s.neighborhood }));

  // Events: slug + title + displayDate from JSON
  const events: EventResult[] = (eventsRaw as any[]).map(e => ({
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
