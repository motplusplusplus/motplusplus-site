import { notFound } from "next/navigation";
import { getAllEvents, getAllEventSlugs, getEventBySlug, getAllEventsFromJson } from "@/lib/sanity";
import { getListingEvents, getRelatedResidents, getAdjacentEvents, isPast, BIO_SLUGS } from "@/lib/events";
import EventContent from "@/components/EventContent";

export async function generateStaticParams() {
  const [sanitySlugs, jsonEvents] = await Promise.all([
    getAllEventSlugs(),
    Promise.resolve(getAllEventsFromJson()),
  ]);
  const sanitySlugSet = new Set(sanitySlugs);
  const jsonOnlySlugs = jsonEvents.map(e => e.slug).filter(s => !sanitySlugSet.has(s));
  const allSlugs = [...sanitySlugs, ...jsonOnlySlugs];
  return allSlugs.filter(slug => !BIO_SLUGS.has(slug)).map(slug => ({ slug }));
}

const SKIP = [
  'logomot', 'a.farmlogo', 's-1-edited', 'amanaki_png', 'artboard',
  'web-e1760', 'web-1-e1760', '3nam-2', 'ajar', 'artrepublik', 'codesurfing',
  'formapubli', 'kirti', 'marg1n', 'matca', 'nbs', 'rr-1', 'vanguard', 'wdg',
  'logo',
];

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
  const relatedResidents = getRelatedResidents(event, allEvents);
  const { prev, next } = getAdjacentEvents(slug, listing);
  const past = isPast(event);

  const galleryImages = event.images.filter(url => {
    const filename = url.split('/').pop() || '';
    return !SKIP.some(s => filename.toLowerCase().includes(s));
  });

  const AFARM_LOGO = 'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/motplus/events/michael-atavar/a.farmlogo_500x500-1-2.jpg';
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
      heroImg={heroImg}
      contentImages={contentImages}
      wpLink={event.wpLink}
      prevEvent={prev ? { slug: prev.slug, title: prev.title } : null}
      nextEvent={next ? { slug: next.slug, title: next.title } : null}
    />
  );
}
