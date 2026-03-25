import Link from "next/link";
import { studios } from "@/lib/studios";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return studios.map((s) => ({ slug: s.slug }));
}

/** Convert a YouTube or Vimeo URL to an embeddable src */
function toEmbedSrc(url: string): string | null {
  if (!url) return null;
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  // Vimeo
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return null;
}

export default async function StudioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = studios.find((s) => s.slug === slug);
  if (!studio) notFound();

  const profile = studio.profile;

  // Combine studio images + work images for the scroll gallery
  const galleryImages = [
    ...studio.images,
    ...(profile?.workImages ?? []),
  ];

  const embedSrc = profile?.walkthroughVideoUrl ? toEmbedSrc(profile.walkthroughVideoUrl) : null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "64px 24px 96px" }}>

      {/* breadcrumb + header */}
      <div style={{ marginBottom: "64px" }}>
        <p style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em", marginBottom: "16px" }}>
          <Link href="/afarm" style={{ color: "#999999" }}>a.Farm</Link>
          {" / "}
          <Link href="/afarm/studios" style={{ color: "#999999" }}>studios</Link>
          {" / "}
          {studio.neighborhood}
          {studio.collectiveMember && (
            <span style={{ marginLeft: "12px" }}>
              ·{" "}
              <Link href="/collective" style={{ color: "#999999" }}>
                mot+++ collective member
              </Link>
            </span>
          )}
        </p>
        <h1 style={{
          fontSize: "clamp(28px, 3.5vw, 48px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: "12px",
        }}>
          {profile?.studioName || studio.artistName}
        </h1>
        {profile?.studioName && (
          <p style={{ fontSize: "16px", color: "#666666", fontWeight: 300, marginBottom: "4px" }}>
            {studio.artistName}
          </p>
        )}
        <p style={{ fontSize: "14px", color: "#aaaaaa", fontWeight: 300 }}>
          {studio.neighborhood}
        </p>
      </div>

      {/* artist portrait */}
      {profile?.portrait && (
        <div style={{ marginBottom: "64px" }}>
          <img
            src={profile.portrait}
            alt={studio.artistName}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "480px",
              aspectRatio: "3/4",
              objectFit: "cover",
              backgroundColor: "#f0f0f0",
            }}
          />
        </div>
      )}

      <div style={{ maxWidth: "720px" }}>

        {/* practice bio */}
        {profile?.practiceBio && (
          <div style={{ marginBottom: "48px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              about the artist
            </p>
            {profile.practiceBio.split(/\n{2,}/).filter(Boolean).map((para, i) => (
              <p key={i} style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "16px" }}>
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/* welcome bio / about the space */}
        {profile?.welcomeBio && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "48px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              about the space
            </p>
            {profile.welcomeBio.split(/\n{2,}/).filter(Boolean).map((para, i) => (
              <p key={i} style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "16px" }}>
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/* fallback description if no profile */}
        {!profile?.welcomeBio && studio.description && (
          <div style={{ marginBottom: "48px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              about the space
            </p>
            {studio.description.split(/\n{2,}/).filter(Boolean).map((para, i) => (
              <p key={i} style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "16px" }}>
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/* collaboration */}
        {profile?.collaboration && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "48px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              collaboration
            </p>
            <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444" }}>
              {profile.collaboration}
            </p>
          </div>
        )}

      </div>

      {/* walkthrough video — full width */}
      {embedSrc && (
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            walkthrough
          </p>
          <div style={{ position: "relative", width: "100%", maxWidth: "900px", aspectRatio: "16/9" }}>
            <iframe
              src={embedSrc}
              title={`${studio.artistName} studio walkthrough`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>
      )}

      {/* horizontal scroll gallery — studio images + work images */}
      {galleryImages.length > 0 && (
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "48px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            studio &amp; work
          </p>
          <div style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "12px",
            scrollbarWidth: "thin" as const,
            scrollbarColor: "#dddddd transparent",
          }}>
            {galleryImages.map((img, i) => (
              <div key={i} style={{
                flexShrink: 0,
                width: "340px",
                aspectRatio: "4/3",
                overflow: "hidden",
                backgroundColor: "#f0f0f0",
              }}>
                <img
                  src={img}
                  alt={`${studio.artistName} — ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: "720px" }}>

        {/* practical details */}
        {profile && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "48px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              practical
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px 40px" }}>
              {profile.environment && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>environment</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>{profile.environment}</p>
                </div>
              )}
              {profile.availability && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>availability</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>{profile.availability}</p>
                </div>
              )}
              {profile.residentRoom && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>accommodation</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>{profile.residentRoom}</p>
                </div>
              )}
              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>languages</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>{profile.languages.join(", ")}</p>
                </div>
              )}
              {profile.transport && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>transport</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>{profile.transport}</p>
                </div>
              )}
              {profile.amenities && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>nearby</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>{profile.amenities}</p>
                </div>
              )}
              {typeof profile.smoking === "boolean" && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>smoking</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>
                    {profile.smoking ? "yes" : "no"}
                    {profile.smokingDetail ? ` — ${profile.smokingDetail}` : ""}
                  </p>
                </div>
              )}
              {typeof profile.guests === "boolean" && (
                <div>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>guests</p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>
                    {profile.guests ? "yes" : "no"}
                    {profile.guestsDetail ? ` — ${profile.guestsDetail}` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* house rules */}
        {profile?.rules && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "48px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "20px" }}>
              house rules
            </p>
            <p style={{ fontSize: "14px", lineHeight: 1.8, color: "#555555" }}>
              {profile.rules}
            </p>
          </div>
        )}

      </div>

      {/* inquire CTA */}
      <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px" }}>
        <p style={{
          fontSize: "15px", marginBottom: "24px",
          color: "#444444", maxWidth: "480px", lineHeight: 1.7,
        }}>
          interested in this studio? get in touch and tell us about your
          practice and what you hope to make in ho chi minh city.
        </p>
        <Link
          href={`/afarm/apply?studio=${studio.slug}`}
          style={{
            display: "inline-block",
            fontSize: "15px",
            fontWeight: 400,
            color: "#ffffff",
            backgroundColor: "#111111",
            padding: "14px 32px",
          }}
        >
          inquire about this studio
        </Link>
      </div>

    </div>
  );
}
