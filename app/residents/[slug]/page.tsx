import { notFound } from "next/navigation";
import Link from "next/link";
import { BIO_SLUGS, getEvent, getRelatedEvents } from "@/lib/events";

export function generateStaticParams() {
  return Array.from(BIO_SLUGS).map(slug => ({ slug }));
}

// Images to skip (logos, footer, partner marks)
const SKIP = [
  'logomot', 'a.farmlogo', 's-1-edited', 'amanaki_png', 'artboard',
  'web-e1760', 'web-1-e1760', '3nam-2', 'ajar', 'artrepublik', 'codesurfing',
  'formapubli', 'kirti', 'marg1n', 'matca', 'nbs', 'rr-1', 'vanguard', 'wdg',
];

export default async function ResidentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resident = getEvent(slug);
  if (!resident || !BIO_SLUGS.has(slug)) notFound();

  const galleryImages = resident.images.filter(url => {
    const filename = url.split('/').pop() || '';
    return !SKIP.some(s => filename.toLowerCase().includes(s));
  });

  const heroImg = galleryImages[0] || null;
  const contentImages = galleryImages.slice(1);
  const relatedEvents = getRelatedEvents(resident);

  return (
    <>
      {/* hero */}
      <div style={{
        position: "relative",
        width: "100%", height: "60vh", minHeight: "400px",
        overflow: "hidden", backgroundColor: "#111111",
      }}>
        {heroImg ? (
          <img
            src={heroImg}
            alt={resident.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.78 }}
          />
        ) : null}
        <div style={{
          position: "absolute", inset: 0,
          background: heroImg
            ? "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.72) 100%)"
            : "none",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "clamp(24px, 4vw, 56px)",
        }}>
          <p style={{
            fontSize: "11px", letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.5)", marginBottom: "14px", fontWeight: 300,
          }}>
            {resident.category}
          </p>
          <h1 style={{
            fontSize: "clamp(24px, 4vw, 52px)",
            fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em",
            color: "#ffffff",
          }}>
            {resident.title}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "52px 24px 96px" }}>

        {/* breadcrumb */}
        <div style={{ marginBottom: "52px" }}>
          <Link href="/residents" style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em" }}>
            ← previous residents
          </Link>
        </div>

        {/* metadata strip */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "40px",
          borderBottom: "1px solid #e5e5e5", paddingBottom: "40px", marginBottom: "56px",
        }}>
          {resident.displayDate && (
            <div>
              <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
                residency
              </p>
              <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>
                {resident.displayDate}
              </p>
            </div>
          )}

          {resident.location && (
            <div>
              <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
                location
              </p>
              <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{resident.location}</p>
            </div>
          )}

          <div>
            <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
              program
            </p>
            <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{resident.category}</p>
          </div>
        </div>

        {/* bio text */}
        {resident.description && (
          <div style={{ maxWidth: "680px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              about
            </p>
            {resident.description.split(/\n{2,}/).filter(Boolean).map((para, i) => (
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
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "8px",
            }}>
              {contentImages.map((img, i) => (
                <div key={i} style={{
                  width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f0f0f0",
                }}>
                  <img
                    src={img}
                    alt={`${resident.title} — ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* related events */}
        {relatedEvents.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              related events
            </p>
            <div>
              {relatedEvents.map(evt => (
                <Link
                  key={evt.slug}
                  href={`/events/${evt.slug}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    gap: "20px", padding: "14px 0", borderBottom: "1px solid #f2f2f2",
                  }}>
                    <div>
                      <p style={{ fontSize: "10px", color: "#bbbbbb", letterSpacing: "0.06em", marginBottom: "4px" }}>
                        {evt.category}
                      </p>
                      <p style={{ fontSize: "14px", fontWeight: 300, color: "#111111", lineHeight: 1.35 }}>
                        {evt.title}
                      </p>
                    </div>
                    <p style={{ fontSize: "12px", color: "#aaaaaa", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {evt.displayDate || evt.dateISO}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* footer nav */}
        <div style={{
          borderTop: "1px solid #e5e5e5", paddingTop: "40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "16px",
        }}>
          <Link href="/residents" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to residents
          </Link>
          {resident.wpLink && (
            <a
              href={resident.wpLink}
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
