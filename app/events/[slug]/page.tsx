import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvent, getEventSlugs, getRelatedResidents, isPast, BIO_SLUGS } from "@/lib/events";

export function generateStaticParams() {
  // BIO_SLUGS get their own pages at /residents/[slug]; skip them here
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

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "52px 24px 96px" }}>

        {/* breadcrumb */}
        <div style={{ marginBottom: "52px" }}>
          <Link href="/events" style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em" }}>
            ← events
          </Link>
        </div>

        {/* metadata strip */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "40px",
          borderBottom: "1px solid #e5e5e5", paddingBottom: "40px", marginBottom: "56px",
        }}>
          <div>
            <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
              date
            </p>
            <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>
              {event.displayDate || event.dateISO}
            </p>
            {past && (
              <p style={{ fontSize: "11px", color: "#bbbbbb", letterSpacing: "0.06em", marginTop: "5px" }}>
                closed
              </p>
            )}
          </div>

          {event.location && (
            <div>
              <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
                location
              </p>
              <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{event.location}</p>
            </div>
          )}

          <div>
            <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
              program
            </p>
            <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{event.category}</p>
          </div>
        </div>

        {/* artist profile links */}
        {relatedResidents.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "12px" }}>
              artist{relatedResidents.length > 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
              {relatedResidents.map(r => (
                <Link
                  key={r.slug}
                  href={`/artists/${r.slug}`}
                  style={{ fontSize: "14px", fontWeight: 300, color: "#111111", textDecoration: "none" }}
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* description */}
        {event.description && (
          <div style={{ maxWidth: "680px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              about
            </p>
            {event.description.split(/\n{2,}/).filter(Boolean).map((para, i) => (
              <p key={i} style={{
                fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px",
              }}>
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/* image gallery */}
        {contentImages.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
              documentation
            </p>

            {/* first content image: wide banner */}
            <div style={{
              width: "100%", aspectRatio: "16/7", overflow: "hidden",
              backgroundColor: "#f0f0f0", marginBottom: "8px",
            }}>
              <img
                src={contentImages[0]}
                alt={`${event.title} — 1`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>

            {/* remaining images: grid */}
            {contentImages.length > 1 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "8px",
              }}>
                {contentImages.slice(1).map((img, i) => (
                  <div key={i} style={{
                    width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f0f0f0",
                  }}>
                    <img
                      src={img}
                      alt={`${event.title} — ${i + 2}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* footer nav */}
        <div style={{
          borderTop: "1px solid #e5e5e5", paddingTop: "40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "16px",
        }}>
          <Link href="/events" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to events
          </Link>
          {event.wpLink && (
            <a
              href={event.wpLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em" }}
            >
              original post ↗
            </a>
          )}
        </div>

      </div>
    </>
  );
}
