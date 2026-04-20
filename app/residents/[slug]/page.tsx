import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { BIO_SLUGS, getRelatedEvents } from "@/lib/events";
import { getAllEvents, getEventBySlug } from "@/lib/sanity";
import { getArtist } from "@/lib/artists";
import { allStudios } from "@/lib/studios";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  const artist = getArtist(slug);
  const name = artist?.name || event?.title || slug;
  const bio = artist?.bio || event?.description || "";
  const description = bio.replace(/^"[^"]*"\s*/,'').slice(0, 160).trim();
  return {
    title: `${name} | MoT+++`,
    description: description || `Artist page for ${name} at MoT+++, Ho Chi Minh City.`,
    openGraph: {
      title: `${name} | MoT+++`,
      description: description || `Artist page for ${name} at MoT+++, Ho Chi Minh City.`,
      ...(artist?.photo ? { images: [{ url: artist.photo }] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const allEvents = await getAllEvents();
  return allEvents
    .filter(e => (BIO_SLUGS.has(e.slug) || e.isBioPage) && !e.slug.startsWith("artist-in-residence-"))
    .map(e => ({ slug: e.slug }));
}

// Images to skip (logos, partner marks, etc.)
const SKIP = [
  'logomot', 'a.farmlogo', 's-1-edited', 'amanaki_png', 'artboard',
  'web-e1760', 'web-1-e1760', '3nam-2', 'ajar', 'artrepublik', 'codesurfing',
  'formapubli', 'kirti', 'marg1n', 'matca', 'nbs', 'rr-1', 'vanguard', 'wdg',
  'logo',
];

export default async function ResidentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug.startsWith("artist-in-residence-")) notFound();

  const [event, allEvents] = await Promise.all([getEventBySlug(slug), getAllEvents()]);
  if (!event) notFound();

  const artist = getArtist(slug);
  const studio = allStudios.find(s => s.hostSlug === slug);

  const bioText = artist?.bio || event.description || "";
  const photo = artist?.photo || "";
  const workImages = artist?.workImages || [];
  const website = artist?.website || "";

  const relatedEvents = getRelatedEvents(event, allEvents);

  const galleryImages = event.images.filter(url => {
    const filename = url.split('/').pop() || '';
    return !SKIP.some(s => filename.toLowerCase().includes(s));
  });

  const isLanAnh = slug === "lan-anh-le";

  return (
    <>
      {/* hero */}
      <div style={{
        position: "relative",
        width: "100%", height: "55vh", minHeight: "360px",
        overflow: "hidden", backgroundColor: "#111111",
      }}>
        {photo && (
          <img
            src={photo}
            alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.72 }}
          />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: photo
            ? "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.78) 100%)"
            : "none",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "clamp(24px, 4vw, 56px)",
        }}>
          <span style={{
            fontSize: "10px", letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.4)", marginBottom: "14px",
            display: "block",
          }}>
            {event.category === '+a.Farm' ? 'a.Farm resident' : '+1 residency'}
          </span>
          <h1 style={{
            fontSize: "clamp(26px, 4.5vw, 56px)",
            fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em",
            color: isLanAnh ? "rgba(255,255,255,0.7)" : "#ffffff",
            fontStyle: isLanAnh ? "italic" : "normal",
          }}>
            {event.title}
          </h1>
          {isLanAnh ? (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "8px", fontWeight: 300 }}>
              1993–2020
            </p>
          ) : event.displayDate && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "8px", fontWeight: 300 }}>
              {event.displayDate}
            </p>
          )}
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
        {(event.displayDate || website) && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "40px",
            borderBottom: "1px solid #e5e5e5", paddingBottom: "40px", marginBottom: "56px",
          }}>
            {event.displayDate && (
              <div>
                <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  residency
                </p>
                <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{event.displayDate}</p>
              </div>
            )}
            {website && (
              <div>
                <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  website
                </p>
                <a
                  href={`https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}
                >
                  {website}
                </a>
              </div>
            )}
          </div>
        )}

        {/* bio */}
        {bioText && (
          <div style={{ maxWidth: "680px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              practice
            </p>
            {bioText.split(/\n{2,}/).filter(Boolean).map((para, i) => (
              <p key={i} style={{
                fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px",
              }}>
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/* gallery — photos from bio event entry */}
        {galleryImages.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
              documentation
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "8px",
            }}>
              {galleryImages.map((img, i) => (
                <div key={i} style={{
                  width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f0f0f0",
                }}>
                  <img
                    src={img}
                    alt={`${event.title} — ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* work images from artists-data (collective members) */}
        {workImages.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
              work
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "8px",
            }}>
              {workImages.map((img, i) => (
                <div key={i} style={{
                  width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f0f0f0",
                }}>
                  <img
                    src={img}
                    alt={`${event.title} — work ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* events at MoT+++ */}
        {relatedEvents.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              at MoT+++
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

        {!bioText && relatedEvents.length === 0 && (
          <div style={{ marginBottom: "80px" }}>
            <p style={{ fontSize: "14px", color: "#aaaaaa", fontWeight: 300 }}>
              artist profile — more information to come.
            </p>
          </div>
        )}

        {/* footer nav */}
        <div style={{
          borderTop: "1px solid #e5e5e5", paddingTop: "40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "16px",
        }}>
          <Link href="/residents" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to previous residents
          </Link>
          {studio && (
            <Link
              href={`/studios/${studio.slug}`}
              style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em" }}
            >
              view studio ↗
            </Link>
          )}
        </div>

      </div>
    </>
  );
}
