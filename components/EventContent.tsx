"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { normalizeDisplayDate } from "@/lib/events";
import EventImagePlaceholder from "@/components/EventImagePlaceholder";

/** Render a paragraph that may contain [text](url) markdown links */
function RichPara({ text, style, className }: { text: string; style: React.CSSProperties; className?: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <p className={className} style={style}>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) {
          return <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}>{m[1]}</a>;
        }
        return part;
      })}
    </p>
  );
}

interface RelatedResident {
  slug: string;
  title: string;
  /** True when a profile page is actually built for this slug. Inactive stubs have no
   *  page, so their name renders as plain text rather than a link to a 404. */
  linked?: boolean;
}

/**
 * One credited name. Links to the profile only when a page exists for it — a credit can
 * name someone whose profile is an inactive stub, and a link there would 404.
 */
function CreditName({ person, role }: { person: RelatedResident; role?: string }) {
  const style = { fontSize: "15px", fontWeight: 300, color: "#333333", textDecoration: "none" } as const;
  const label = (
    <>
      {person.title}
      {role ? <> <span style={{ color: "#767676" }}>({role})</span></> : null}
    </>
  );
  return person.linked === false
    ? <span style={style}>{label}</span>
    : <Link href={`/profiles/${person.slug}`} style={style}>{label}</Link>;
}

interface EventPartner {
  name: string;
  url?: string | null;
  role: string;
}

/**
 * Organizations credited on an event — funder, venue, co-manager, lender, collaborator.
 * Renders below the description, only when non-empty. No public partner page exists: the
 * name links straight to the partner's own site when one is on file, plain text when it
 * isn't (some partners are defunct — the dead link stays, it's a historical fact).
 */
function PartnerCredit({ partners }: { partners: EventPartner[] }) {
  if (partners.length === 0) return null;
  return (
    <div style={{ marginBottom: "80px" }}>
      <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "16px" }}>
        partners
      </p>
      <p style={{ fontSize: "15px", fontWeight: 300, color: "#444444", lineHeight: 1.7 }}>
        {partners.map((p, i) => (
          <span key={p.name}>
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                {p.name}
              </a>
            ) : (
              p.name
            )}
            {i < partners.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}

interface AdjacentEvent {
  slug: string;
  title: string;
}

interface EventContentProps {
  title: string;
  vnTitle?: string;
  description: string;
  vnDescription?: string;
  videoUrl?: string;
  category: string;
  displayDate: string;
  dateISO: string;
  location?: string;
  past: boolean;
  relatedResidents: RelatedResident[];
  /** Credits with role "curator". Empty for every event without one — the section
   *  is then not rendered at all, heading included. */
  curators?: RelatedResident[];
  /** Every credit that is neither artist nor curator — moderator, dj, performer,
   *  researcher and so on. Rendered under one "with" heading, each name suffixed with
   *  its role, so a role added to the enum shows up without a new block. */
  otherCredits?: (RelatedResident & { role: string })[];
  /** Organizations credited on this event. Empty for every event without one — see
   *  PartnerCredit. */
  partners?: EventPartner[];
  heroImg: string | null;
  contentImages: string[];
  wpLink?: string;
  prevEvent: AdjacentEvent | null;
  nextEvent: AdjacentEvent | null;
  seeAlso?: AdjacentEvent[];
}

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    if ((u.hostname === "www.youtube.com" || u.hostname === "youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }
    // vimeo.com/ID
    if (u.hostname === "vimeo.com" || u.hostname === "www.vimeo.com") {
      const id = u.pathname.slice(1);
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function EventContent({
  title,
  vnTitle,
  description,
  vnDescription,
  videoUrl,
  category,
  displayDate,
  dateISO,
  location,
  past,
  relatedResidents,
  curators = [],
  otherCredits = [],
  partners = [],
  heroImg,
  contentImages,
  wpLink,
  prevEvent,
  nextEvent,
  seeAlso,
}: EventContentProps) {
  const hasBilingual = Boolean(vnTitle || vnDescription);
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // All images: hero first, then content — used for lightbox cycle
  // contentImages already excludes heroImg (filtered in page.tsx)
  const allImages = heroImg ? [heroImg, ...contentImages] : contentImages;
  // Gallery click offset: allImages[0] = hero, so gallery[0] = allImages[1]
  const heroOffset = heroImg ? 1 : 0;

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setLightboxIdx(i => i !== null ? Math.min(i + 1, allImages.length - 1) : null);
      if (e.key === "ArrowLeft")  setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, closeLightbox, allImages.length]);

  const activeTitle = lang === "vi" && vnTitle ? vnTitle : title;
  const activeDescription = lang === "vi" && vnDescription ? vnDescription : description;

  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  return (
    <>
      {/* hero banner — clickable to open lightbox at index 0 */}
      <div
        onClick={allImages.length > 0 ? () => setLightboxIdx(0) : undefined}
        style={{
          position: "relative",
          width: "100%", height: "70vh", minHeight: "460px",
          overflow: "hidden", backgroundColor: "#111111",
          cursor: allImages.length > 0 ? "zoom-in" : "default",
        }}
      >
        {heroImg ? (
          <img
            src={heroImg}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.78 }}
          />
        ) : (
          // No image of its own. The wordmark used to be substituted as this src and drawn
          // with object-fit: cover in a 70vh landscape container, which cropped it out of
          // recognition. The placeholder contains rather than covers.
          <EventImagePlaceholder size="hero" title={title} />
        )}
        <div className="evt-hero-pad" style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.72) 100%)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          pointerEvents: "none",
        }}>
          <p style={{
            fontSize: "11px", letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.5)", marginBottom: "14px", fontWeight: 300,
          }}>
            {category}
          </p>
          <h1 className="evt-title-w evt-w" style={{
            fontSize: "clamp(22px, 3.5vw, 44px)",
            fontWeight: 300, lineHeight: 1.15, letterSpacing: "-0.02em",
            color: "#ffffff",
          }}>
            {title}
          </h1>
        </div>
      </div>

    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "52px 24px 96px" }}>

      {/* lightbox overlay */}
      {lightboxIdx !== null && (
        <div
          onClick={closeLightbox}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={allImages[lightboxIdx]}
            alt=""
            style={{ maxWidth: "92vw", maxHeight: "92vh", objectFit: "contain", display: "block" }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={closeLightbox}
            style={{
              position: "absolute", top: "20px", right: "24px",
              background: "none", border: "none", color: "#ffffff",
              fontSize: "28px", cursor: "pointer", lineHeight: 1, padding: "4px 8px",
            }}
            aria-label="Close"
          >×</button>
          {allImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null); }}
                style={{
                  position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#ffffff",
                  fontSize: "32px", cursor: "pointer", padding: "8px 12px", opacity: lightboxIdx === 0 ? 0.3 : 0.9,
                }}
                aria-label="Previous"
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null ? Math.min(i + 1, allImages.length - 1) : null); }}
                style={{
                  position: "absolute", right: "56px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#ffffff",
                  fontSize: "32px", cursor: "pointer", padding: "8px 12px", opacity: lightboxIdx === allImages.length - 1 ? 0.3 : 0.9,
                }}
                aria-label="Next"
              >›</button>
            </>
          )}
          <span style={{
            position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.5)", fontSize: "12px", letterSpacing: "0.1em",
          }}>
            {lightboxIdx + 1} / {allImages.length}
          </span>
        </div>
      )}

      {/* breadcrumb + bilingual toggle row */}
      <div className="evt-w" style={{
        marginBottom: "52px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <Link href="/events" style={{ fontSize: "12px", color: "#767676", letterSpacing: "0.06em" }}>
          ← events
        </Link>
        {hasBilingual && (
          <div style={{ display: "flex", gap: "0", border: "1px solid #e5e5e5", borderRadius: "3px", overflow: "hidden" }}>
            <button
              onClick={() => setLang("en")}
              style={{
                padding: "5px 12px",
                fontSize: "11px",
                letterSpacing: "0.06em",
                border: "none",
                cursor: "pointer",
                backgroundColor: lang === "en" ? "#111111" : "#ffffff",
                color: lang === "en" ? "#ffffff" : "#999999",
                fontFamily: "inherit",
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLang("vi")}
              style={{
                padding: "5px 12px",
                fontSize: "11px",
                letterSpacing: "0.06em",
                border: "none",
                borderLeft: "1px solid #e5e5e5",
                cursor: "pointer",
                backgroundColor: lang === "vi" ? "#111111" : "#ffffff",
                color: lang === "vi" ? "#ffffff" : "#999999",
                fontFamily: "inherit",
              }}
            >
              VI
            </button>
          </div>
        )}
      </div>

      {/* metadata strip */}
      <div className="evt-w" style={{
        display: "flex", flexWrap: "wrap", gap: "40px",
        borderBottom: "1px solid #e5e5e5", paddingBottom: "40px", marginBottom: "56px",
      }}>
        <div>
          <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
            date
          </p>
          <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>
            {normalizeDisplayDate(displayDate || dateISO)}
          </p>
          {past && (
            <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.06em", marginTop: "5px" }}>
              closed
            </p>
          )}
        </div>

        {location && (
          <div>
            <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
              location
            </p>
            <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{location}</p>
          </div>
        )}

        <div>
          <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
            program
          </p>
          <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{category}</p>
        </div>

        {relatedResidents.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
              artist{relatedResidents.length > 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {relatedResidents.map(r => <CreditName key={r.slug} person={r} />)}
            </div>
          </div>
        )}

        {curators.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
              curated by
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {curators.map(cur => <CreditName key={cur.slug} person={cur} />)}
            </div>
          </div>
        )}

        {otherCredits.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
              with
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {otherCredits.map(oc => (
                <CreditName key={`${oc.slug}-${oc.role}`} person={oc} role={oc.role} />
              ))}
            </div>
          </div>
        )}

        {seeAlso && seeAlso.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
              see also
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {seeAlso.map(e => (
                <Link
                  key={e.slug}
                  href={`/events/${e.slug}`}
                  style={{ fontSize: "15px", fontWeight: 300, color: "#333333", textDecoration: "none" }}
                >
                  {e.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* title (shown only in VI mode when vnTitle exists, to clarify which language) */}
      {lang === "vi" && vnTitle && (
        <h2 style={{
          fontSize: "clamp(18px, 2.5vw, 30px)",
          fontWeight: 300,
          letterSpacing: "-0.01em",
          color: "#111111",
          marginBottom: "40px",
          lineHeight: 1.25,
        }}>
          {activeTitle}
        </h2>
      )}

      {/* description — mobile keeps the original size/measure untouched; desktop gets
          the enlargement via .evt-desc-* classes + a min-width breakpoint in
          globals.css, since inline styles can't carry a media query. */}
      {activeDescription && (
        <div className="evt-desc evt-w" style={{ marginBottom: "80px" }}>
          <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "28px" }}>
            about
          </p>
          {activeDescription.split(/\n{2,}/).filter(Boolean).map((para, i) => (
            <RichPara key={i} text={para.trim()} className="evt-desc-text" style={{
              color: "#444444",
            }} />
          ))}
        </div>
      )}

      <PartnerCredit partners={partners} />

      {/* video embed */}
      {embedUrl && (
        <div style={{ marginBottom: "80px" }}>
          <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "24px" }}>
            video
          </p>
          <div className="evt-video-w evt-w" style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>
      )}

      {/* image gallery */}
      {contentImages.length > 0 && (
        <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
          <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "32px" }}>
            documentation
          </p>

          {/* first content image: wide banner */}
          <div
            onClick={() => setLightboxIdx(heroOffset + 0)}
            style={{
              width: "100%", aspectRatio: "16/7", overflow: "hidden",
              backgroundColor: "#f0f0f0", marginBottom: "8px", cursor: "zoom-in",
            }}
          >
            <img
              src={contentImages[0]}
              alt={`${title} — 1`}
              loading="eager"
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
                <div
                  key={i}
                  onClick={() => setLightboxIdx(heroOffset + i + 1)}
                  style={{
                    width: "100%", aspectRatio: "4/3", overflow: "hidden",
                    backgroundColor: "#f0f0f0", cursor: "zoom-in",
                  }}
                >
                  <img
                    src={img}
                    alt={`${title} — ${i + 2}`}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* footer nav */}
      <div className="evt-w" style={{
        borderTop: "1px solid #e5e5e5", paddingTop: "40px",
      }}>
        {/* prev / next */}
        {(prevEvent || nextEvent) && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginBottom: "32px",
          }}>
            <div>
              {prevEvent && (
                <Link href={`/events/${prevEvent.slug}`} style={{ textDecoration: "none" }}>
                  <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    ← newer
                  </p>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: "#333333", lineHeight: 1.35 }}>
                    {prevEvent.title}
                  </p>
                </Link>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {nextEvent && (
                <Link href={`/events/${nextEvent.slug}`} style={{ textDecoration: "none" }}>
                  <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    older →
                  </p>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: "#333333", lineHeight: 1.35 }}>
                    {nextEvent.title}
                  </p>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* back link + original post */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "16px",
          borderTop: "1px solid #f2f2f2", paddingTop: "24px",
        }}>
          <Link href="/events" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to events
          </Link>
          {wpLink && (
            <a
              href={wpLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.06em" }}
            >
              original post ↗
            </a>
          )}
        </div>
      </div>

    </div>
    </>
  );
}
