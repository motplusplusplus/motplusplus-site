import { notFound } from "next/navigation";
import { getAllEvents, getAllEventSlugs, getEventBySlug, getAllEventsFromJson } from "@/lib/sanity";
import { getListingEvents, getAdjacentEvents, isPast, BIO_SLUGS, HIDDEN_SLUGS } from "@/lib/events";
import EventContent from "@/components/EventContent";
import { isJunkImage } from "@/lib/junk-images";
import type { Metadata } from "next";
import { ogImage } from "@/lib/og";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (HIDDEN_SLUGS.has(slug)) return {};
  const jsonEvents = getAllEventsFromJson();
  const sanityEvent = await getEventBySlug(slug);
  const event = sanityEvent ?? jsonEvents.find(e => e.slug === slug) ?? null;
  if (!event) return {};

  const galleryImages = event.images.filter(url => !isJunkImage(url));
  // Same cover-image pick as the page's visual hero (prefer first jpg — png
  // flyers were often not uploaded to R2), minus the logo fallback below.
  const cover = galleryImages.find(u => /\.(jpg|jpeg)$/i.test(u)) || galleryImages[0] || event.thumbnail || undefined;

  const title = event.title;
  const socialTitle = `${event.title} | MoT+++`;
  const description = event.description?.slice(0, 160).trim() || `${event.title} — MoT+++, Ho Chi Minh City.`;
  const image = ogImage(cover, event.title);

  return {
    title,
    description,
    openGraph: {
      title: socialTitle,
      description,
      url: `https://motplusplusplus.com/events/${slug}`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.url],
    },
    alternates: { canonical: `https://motplusplusplus.com/events/${slug}` },
  };
}

export async function generateStaticParams() {
  const [sanitySlugs, jsonEvents] = await Promise.all([
    getAllEventSlugs(),
    Promise.resolve(getAllEventsFromJson()),
  ]);
  const sanitySlugSet = new Set(sanitySlugs);
  const jsonOnlySlugs = jsonEvents.map(e => e.slug).filter(s => !sanitySlugSet.has(s));
  const allSlugs = [...sanitySlugs, ...jsonOnlySlugs];
  return allSlugs.filter(slug => !BIO_SLUGS.has(slug) && !HIDDEN_SLUGS.has(slug)).map(slug => ({ slug }));
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (HIDDEN_SLUGS.has(slug)) notFound();
  const jsonEvents = getAllEventsFromJson();
  const [sanityEvent, sanityAllEvents] = await Promise.all([
    getEventBySlug(slug),
    getAllEvents(),
  ]);
  // Fall back to JSON data for events not in Sanity
  const event = sanityEvent ?? jsonEvents.find(e => e.slug === slug) ?? null;
  if (!event) notFound();

  // Merge for navigation / related events
  const sanitySlugSet = new Set(sanityAllEvents.map(e => e.slug));
  const jsonOnly = jsonEvents.filter(e => !sanitySlugSet.has(e.slug));
  const allEvents = [...sanityAllEvents, ...jsonOnly];

  const listing = getListingEvents(allEvents);
  // Artists and curators are split out of ONE credits[] array — there is no curatedBy
  // field, deliberately: credits[] already carries role, and a second writable field for
  // the same fact is the two-sources-of-truth problem Phase B removed.
  //
  // Everything that is NOT a curator goes in the artist list, rather than picking out
  // role === 'artist'. The enum also holds performer, dj, member, photographer,
  // participant and partner; an allowlist would silently drop all of them off the page
  // the first time anyone used one. Today every non-curator credit happens to be
  // 'artist', so the two rules agree — which is exactly when to choose the one that
  // stays correct later.
  //
  // Events from events-data.json have no credits[] (~26 of them), so they fall back to
  // the artists[] mirror and render as they always have.
  const credited = event.credits ?? [];
  const curators = credited
    .filter(c => c.role === 'curator' && c.person)
    .map(c => ({ slug: c.person!.slug, title: c.person!.name }));
  const relatedResidents = credited.length
    ? credited
        .filter(c => c.role !== 'curator' && c.person)
        .map(c => ({ slug: c.person!.slug, title: c.person!.name }))
    : (event.artists ?? []).map(a => ({ slug: a.slug, title: a.name }));
  const { prev, next } = getAdjacentEvents(slug, listing);
  const past = isPast(event);

  const galleryImages = event.images.filter(url => !isJunkImage(url));

  const AFARM_LOGO = 'https://pub-136b7c559e56403eb674c24e717611c6.r2.dev/motplus/events/michael-atavar/a.farmlogo_500x500-1-2.jpg';
  const MOT_LOGO = '/motpluspluspluslogo.jpg';
  const isAfarm = event.category?.toLowerCase().includes('a.farm');

  // Prefer first jpg for hero — png flyers were often not uploaded to R2
  const realHero =
    galleryImages.find(u => /\.(jpg|jpeg)$/i.test(u)) ||
    galleryImages[0] ||
    event.thumbnail ||
    null;
  const logoFallback = isAfarm ? AFARM_LOGO : MOT_LOGO;
  const heroImg = realHero || logoFallback;

  // contentImages = all gallery images except the one used as hero
  const contentImages = galleryImages.filter(u => u !== heroImg);

  const SEE_ALSO: Record<string, { slug: string; title: string }[]> = {
    "all-animals-are-equal-1": [{ slug: "all-animals-are-equal-2", title: "All Animals Are Equal #2" }],
    "all-animals-are-equal-2": [{ slug: "all-animals-are-equal-1", title: "All Animals Are Equal #1" }],
  };

  return (
    <EventContent
      title={event.title}
      vnTitle={event.vnTitle}
      description={event.description}
      vnDescription={event.vnDescription}
      videoUrl={event.videoUrl}
      category={event.category}
      displayDate={event.displayDate}
      dateISO={event.dateISO}
      location={event.location}
      past={past}
      relatedResidents={relatedResidents.map(r => ({ slug: r.slug, title: r.title }))}
      curators={curators}
      heroImg={heroImg}
      contentImages={contentImages}
      wpLink={event.wpLink}
      prevEvent={prev ? { slug: prev.slug, title: prev.title } : null}
      nextEvent={next ? { slug: next.slug, title: next.title } : null}
      seeAlso={SEE_ALSO[slug]}
    />
  );
}
