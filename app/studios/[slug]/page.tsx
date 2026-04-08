import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getStudio, getStudioSlugs, getStudioEvents, type StudioPractical } from "@/lib/studios";
import { getArtist } from "@/lib/artists";
import { getAllEvents } from "@/lib/sanity";
import { getListingEvents } from "@/lib/events";
import StudioProfileContent from "./StudioProfileContent";
import StudioGallery from "./StudioGallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) return {};
  const description = studio.description
    ? studio.description.slice(0, 160).trim()
    : `${studio.name} — artist studio associated with MoT+++, Ho Chi Minh City.`;
  return {
    title: `${studio.name} | MoT+++`,
    description,
    openGraph: {
      title: `${studio.name} | MoT+++`,
      description,
      ...(studio.images[0] ? { images: [{ url: studio.images[0] }] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const slugs = await getStudioSlugs();
  return slugs.map(slug => ({ slug }));
}

type PracticalField = {
  key: keyof StudioPractical;
  label: string;
  type: "string" | "boolean" | "number";
};

const PRACTICAL_FIELDS: PracticalField[] = [
  { key: "floor",           label: "floor",              type: "string"  },
  { key: "size",            label: "size (m²)",          type: "number"  },
  { key: "naturalLight",    label: "natural light",      type: "boolean" },
  { key: "ac",              label: "air conditioning",   type: "boolean" },
  { key: "bathrooms",       label: "bathrooms",          type: "number"  },
  { key: "privateBathroom", label: "private bathroom",   type: "boolean" },
  { key: "kitchenAccess",   label: "kitchen access",     type: "boolean" },
  { key: "internet",        label: "internet",           type: "boolean" },
  { key: "petsInResidence", label: "pets in residence",  type: "boolean" },
  { key: "petsAllowed",     label: "pets allowed",       type: "boolean" },
  { key: "laundry",         label: "laundry",            type: "boolean" },
];

function formatPracticalValue(value: string | boolean | number | null, type: PracticalField["type"]): string {
  if (value === null || value === undefined) return "";
  if (type === "boolean") return value ? "yes" : "no";
  return String(value);
}

export default async function StudioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const studio = await getStudio(slug);
  if (!studio) notFound();

  const host = studio.hostSlug ? getArtist(studio.hostSlug) : null;
  const allEvents = await getAllEvents();
  const studioEvents = getStudioEvents(studio, getListingEvents(allEvents));

  // Check if any practical fields are non-null
  const hasPractical = PRACTICAL_FIELDS.some(f => studio.practical[f.key] !== null);

  // Prepare visible practical rows
  const practicalRows = PRACTICAL_FIELDS
    .map(f => ({ label: f.label, value: studio.practical[f.key], type: f.type }))
    .filter(r => r.value !== null);

  // Host bio excerpt
  const hostBioExcerpt = host?.bio ? host.bio.slice(0, 200).trim() + (host.bio.length > 200 ? "…" : "") : "";

  return (
    <>
      {/* hero */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "55vh",
          minHeight: "320px",
          overflow: "hidden",
          backgroundColor: "#111111",
        }}
      >
        {studio.images[0] ? (
          <img
            src={studio.images[0]}
            alt={studio.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.75 }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: studio.images[0]
              ? "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.88) 100%)"
              : "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "clamp(24px, 4vw, 56px)",
          }}
        >
          {!studio.active && (
            <div style={{ marginBottom: "14px" }}>
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  padding: "3px 8px",
                }}
              >
                historical
              </span>
            </div>
          )}
          <h1
            style={{
              fontSize: "clamp(26px, 4.5vw, 56px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#ffffff",
            }}
          >
            {studio.name}
          </h1>
          {studio.neighborhood && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "10px", fontWeight: 300 }}>
              {studio.neighborhood}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "52px 24px 96px" }}>

        {/* breadcrumb */}
        <div style={{ marginBottom: "52px" }}>
          <Link href="/studios" style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em" }}>
            ← studios
          </Link>
        </div>

        {/* host section */}
        {host && (
          <div
            style={{
              borderBottom: "1px solid #e5e5e5",
              paddingBottom: "56px",
              marginBottom: "56px",
              display: "flex",
              gap: "32px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {host.photo && (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  backgroundColor: "#f0f0f0",
                }}
              >
                <img
                  src={host.photo}
                  alt={host.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: "240px" }}>
              <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "8px" }}>
                hosting artist
              </p>
              <Link
                href={`/artists/${studio.hostSlug}`}
                style={{
                  fontSize: "18px",
                  fontWeight: 300,
                  color: "#111111",
                  borderBottom: "1px solid #cccccc",
                  paddingBottom: "1px",
                }}
              >
                {host.name}
              </Link>
              {hostBioExcerpt && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "#555555",
                    lineHeight: 1.75,
                    marginTop: "12px",
                    maxWidth: "560px",
                    fontWeight: 300,
                  }}
                >
                  {hostBioExcerpt}
                </p>
              )}
            </div>
          </div>
        )}

        {/* profile content (bilingual) or plain description fallback */}
        {studio.profile ? (
          <div style={{ marginBottom: "72px" }}>
            <StudioProfileContent profile={studio.profile} profileVi={studio.profileVi} />
          </div>
        ) : (
          <div style={{ maxWidth: "680px", marginBottom: "72px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              about the space
            </p>
            {studio.description ? (
              studio.description.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p
                  key={i}
                  style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}
                >
                  {para.trim()}
                </p>
              ))
            ) : (
              <p style={{ fontSize: "14px", color: "#aaaaaa", fontWeight: 300 }}>
                information coming soon.
              </p>
            )}
            {studio.address && (
              <p style={{ fontSize: "13px", color: "#888888", marginTop: "20px", lineHeight: 1.6 }}>
                {studio.address}
              </p>
            )}
          </div>
        )}

        {/* map */}
        {studio.mapLat && studio.mapLng && (() => {
          const lat = studio.mapLat!;
          const lng = studio.mapLng!;
          const offset = 0.004;
          const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
          const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
          return (
            <div style={{ marginBottom: "72px" }}>
              <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "16px" }}>
                general location
              </p>
              <iframe
                src={src}
                width="100%"
                height="280"
                style={{ border: "1px solid #e5e5e5", display: "block" }}
                title={`Map — ${studio.name}`}
              />
              <p style={{ fontSize: "10px", color: "#cccccc", marginTop: "8px" }}>
                approximate area shown for privacy
              </p>
            </div>
          );
        })()}

        {/* practical info */}
        {hasPractical && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "72px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
              practical info
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "24px 40px",
                maxWidth: "720px",
              }}
            >
              {practicalRows.map(({ label, value, type }) => (
                <div key={label}>
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "4px" }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: 300, color: "#333333" }}>
                    {formatPracticalValue(value as string | boolean | number | null, type)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* studio images with lightbox */}
        {studio.images.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "72px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
              images
            </p>
            <StudioGallery images={studio.images} studioName={studio.name} />
          </div>
        )}

        {/* note */}
        {studio.note && (
          <div
            style={{
              borderLeft: "2px solid #e5e5e5",
              paddingLeft: "16px",
              marginBottom: "72px",
              maxWidth: "560px",
            }}
          >
            <p style={{ fontSize: "13px", color: "#999999", lineHeight: 1.7, fontWeight: 300 }}>
              {studio.note}
            </p>
          </div>
        )}

        {/* events at this space */}
        {studioEvents.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "72px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
              events at this space
            </p>
            <div>
              {studioEvents.map(evt => (
                <Link
                  key={evt.slug}
                  href={`/events/${evt.slug}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "20px",
                      padding: "14px 0",
                      borderBottom: "1px solid #f2f2f2",
                    }}
                  >
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
        <div
          style={{
            borderTop: "1px solid #e5e5e5",
            paddingTop: "40px",
          }}
        >
          <Link href="/studios" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to studios
          </Link>
        </div>

      </div>
    </>
  );
}
