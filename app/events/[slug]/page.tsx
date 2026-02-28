import { notFound } from "next/navigation";
import { getEvent, getEventSlugs, getRelatedResidents, getAdjacentEvents, isPast, BIO_SLUGS } from "@/lib/events";
import EventContent from "@/components/EventContent";

export function generateStaticParams() {
  // BIO_SLUGS get their own pages at /artists/[slug]; skip them here
  return getEventSlugs()
    .filter(slug => !BIO_SLUGS.has(slug))
    .map(slug => ({ slug }));
}

// Images to skip (logos, footer, partner marks)
const SKIP = [
  'logomot', 'a.farmlogo', 's-1-edited', 'amanaki_png', 'artboard',
  'web-e1760', 'web-1-e1760', '3nam-2', 'ajar', 'artrepublik', 'codesurfing',
  'formapubli', 'kirti', 'marg1n', 'matca', 'nbs', 'rr-1', 'vanguard', 'wdg',
];

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const relatedResidents = getRelatedResidents(event);
  const { prev, next } = getAdjacentEvents(slug);

  const past = isPast(event);

  const galleryImages = event.images.filter(url => {
    const filename = url.split('/').pop() || '';
    return !SKIP.some(s => filename.toLowerCase().includes(s));
  });

  const heroImg = galleryImages[0] || event.thumbnail;
  const contentImages = galleryImages.slice(1);

  return (
    <>
      {/* hero with title overlay */}
      <div style={{
        position: "relative",
        width: "100%", height: "70vh", minHeight: "460px",
        overflow: "hidden", backgroundColor: "#111111",
      }}>
        {heroImg && (
          <img
            src={heroImg}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.78 }}
          />
        )}
        {/* gradient + text overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.72) 100%)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "clamp(24px, 4vw, 56px)",
        }}>
          <p style={{
            fontSize: "11px", letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.5)", marginBottom: "14px", fontWeight: 300,
          }}>
            {event.category}
          </p>
          <h1 style={{
            fontSize: "clamp(22px, 3.5vw, 44px)",
            fontWeight: 300, lineHeight: 1.15, letterSpacing: "-0.02em",
            color: "#ffffff", maxWidth: "860px",
          }}>
            {event.title}
          </h1>
        </div>
      </div>

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
        contentImages={contentImages}
        wpLink={event.wpLink}
        prevEvent={prev ? { slug: prev.slug, title: prev.title } : null}
        nextEvent={next ? { slug: next.slug, title: next.title } : null}
      />
    </>
  );
}
