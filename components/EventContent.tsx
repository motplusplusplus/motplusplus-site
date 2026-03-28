"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface RelatedResident {
  slug: string;
  title: string;
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
  contentImages: string[];
  wpLink?: string;
  prevEvent: AdjacentEvent | null;
  nextEvent: AdjacentEvent | null;
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
  contentImages,
  wpLink,
  prevEvent,
  nextEvent,
}: EventContentProps) {
  const hasBilingual = Boolean(vnTitle || vnDescription);
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [lightbox, setLightbox] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeLightbox(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  const activeTitle = lang === "vi" && vnTitle ? vnTitle : title;
  const activeDescription = lang === "vi" && vnDescription ? vnDescription : description;

  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "52px 24px 96px" }}>

      {/* lightbox overlay */}
      {lightbox && (
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
            src={lightbox}
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
        </div>
      )}

      {/* breadcrumb + bilingual toggle row */}
      <div style={{
        marginBottom: "52px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <Link href="/events" style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em" }}>
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
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "40px",
        borderBottom: "1px solid #e5e5e5", paddingBottom: "40px", marginBottom: "56px",
      }}>
        <div>
          <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
            date
          </p>
          <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>
            {displayDate || dateISO}
          </p>
          {past && (
            <p style={{ fontSize: "11px", color: "#bbbbbb", letterSpacing: "0.06em", marginTop: "5px" }}>
              closed
            </p>
          )}
        </div>

        {location && (
          <div>
            <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
              location
            </p>
            <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{location}</p>
          </div>
        )}

        <div>
          <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
            program
          </p>
          <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{category}</p>
        </div>

        {relatedResidents.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.1em", marginBottom: "6px" }}>
              artist{relatedResidents.length > 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {relatedResidents.map(r => (
                <Link
                  key={r.slug}
                  href={`/artists/${r.slug}`}
                  style={{ fontSize: "15px", fontWeight: 300, color: "#333333", textDecoration: "none" }}
                >
                  {r.title}
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

      {/* description */}
      {activeDescription && (
        <div style={{ maxWidth: "680px", marginBottom: "80px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "28px" }}>
            about
          </p>
          {activeDescription.split(/\n{2,}/).filter(Boolean).map((para, i) => (
            <p key={i} style={{
              fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px",
            }}>
              {para.trim()}
            </p>
          ))}
        </div>
      )}

      {/* video embed */}
      {embedUrl && (
        <div style={{ marginBottom: "80px" }}>
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "24px" }}>
            video
          </p>
          <div style={{ position: "relative", width: "100%", maxWidth: "800px", aspectRatio: "16/9" }}>
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
          <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
            documentation
          </p>

          {/* first content image: wide banner */}
          <div
            onClick={() => setLightbox(contentImages[0])}
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
                  onClick={() => setLightbox(img)}
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
      <div style={{
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
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.08em", marginBottom: "6px" }}>
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
                  <p style={{ fontSize: "10px", color: "#aaaaaa", letterSpacing: "0.08em", marginBottom: "6px" }}>
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
              style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em" }}
            >
              original post ↗
            </a>
          )}
        </div>
      </div>

    </div>
  );
}
