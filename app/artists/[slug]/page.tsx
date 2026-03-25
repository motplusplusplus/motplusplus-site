import { notFound } from "next/navigation";
import Link from "next/link";
import { getArtist, getArtistSlugs, getArtistEvents, type Artist } from "@/lib/artists";
import { getEventBySlug, getAllEvents, getArtistBySlug, getAllSanityArtistSlugs } from "@/lib/sanity";

export async function generateStaticParams() {
  const localSlugs = getArtistSlugs();
  const sanitySlugs = await getAllSanityArtistSlugs();
  const all = new Set([...localSlugs, ...sanitySlugs]);
  return Array.from(all).map(slug => ({ slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const localArtist = getArtist(slug);

  // For Sanity-only artists (not in artists-data.json or BIO_SLUGS)
  const sanityArtist = !localArtist ? await getArtistBySlug(slug) : null;
  if (!localArtist && !sanityArtist) notFound();

  // Merge: local data wins, Sanity fills gaps
  const artist: Artist = localArtist ?? {
    slug,
    name:       sanityArtist!.name as string,
    collective: false,
    resident:   !!(sanityArtist!.isAfarmResident),
    studioHost: false,
    origin:     ([sanityArtist!.originCity, sanityArtist!.nationality] as string[]).filter(Boolean).join(", "),
    website:    ((sanityArtist!.links?.[0] as string) ?? "").replace(/^https?:\/\//, ""),
    bio:        (sanityArtist!.bio as string) ?? "",
    photo:      (sanityArtist!.portrait as string) ?? "",
    workImages: (sanityArtist!.images as string[]) ?? [],
  };

  // For residents: pull bio text from Sanity event entry if artists-data bio is empty
  const [eventBio, allEvents] = await Promise.all([
    artist.resident && !artist.bio ? getEventBySlug(slug) : Promise.resolve(null),
    getAllEvents(),
  ]);
  const bioText = artist.bio || (sanityArtist?.bio as string) || eventBio?.description || "";
  const displayDate = eventBio?.displayDate || "";

  const relatedEvents = getArtistEvents(artist, allEvents);

  const badges = [
    artist.collective && "mot+++ collective",
    artist.resident   && "a.Farm resident",
    artist.studioHost && "hosting artist",
  ].filter(Boolean) as string[];

  return (
    <>
      {/* hero */}
      <div style={{
        position: "relative",
        width: "100%", height: "55vh", minHeight: "360px",
        overflow: "hidden", backgroundColor: "#111111",
      }}>
        {artist.photo ? (
          <img
            src={artist.photo}
            alt={artist.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.72 }}
          />
        ) : null}
        <div style={{
          position: "absolute", inset: 0,
          background: artist.photo
            ? "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.78) 100%)"
            : "none",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "clamp(24px, 4vw, 56px)",
        }}>
          {/* badges */}
          {badges.length > 0 && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
              {badges.map(b => (
                <span key={b} style={{
                  fontSize: "10px", letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "3px 8px",
                }}>
                  {b}
                </span>
              ))}
            </div>
          )}
          <h1 style={{
            fontSize: "clamp(26px, 4.5vw, 56px)",
            fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em",
            color: "#ffffff",
          }}>
            {artist.name}
          </h1>
          {artist.origin && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "10px", fontWeight: 300 }}>
              {artist.origin}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "52px 24px 96px" }}>

        {/* breadcrumb */}
        <div style={{ marginBottom: "52px" }}>
          <Link href="/artists" style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em" }}>
            ← artists
          </Link>
        </div>

        {/* metadata strip */}
        {(displayDate || artist.website) && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "40px",
            borderBottom: "1px solid #e5e5e5", paddingBottom: "40px", marginBottom: "56px",
          }}>
            {displayDate && (
              <div>
                <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  residency
                </p>
                <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{displayDate}</p>
              </div>
            )}
            {artist.website && (
              <div>
                <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  website
                </p>
                <a
                  href={`https://${artist.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}
                >
                  {artist.website}
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

        {/* work images (collective members) */}
        {artist.workImages.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
              work
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "8px",
            }}>
              {artist.workImages.map((img, i) => (
                <div key={i} style={{
                  width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f0f0f0",
                }}>
                  <img
                    src={img}
                    alt={`${artist.name} — work ${i + 1}`}
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

        {/* if no bio and no events: minimal state */}
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
          <Link href="/artists" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to artists
          </Link>
          {artist.collective && (
            <Link
              href={`/collective#${artist.name.toLowerCase().replace(/\s+/g, "-")}`}
              style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em" }}
            >
              view on collective page ↗
            </Link>
          )}
        </div>

      </div>
    </>
  );
}
