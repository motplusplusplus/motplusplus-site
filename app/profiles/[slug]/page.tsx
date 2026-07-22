import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { getArtist, getArtistSlugs, type Artist } from "@/lib/artists";
import { getEventBySlug, getArtistBySlug, getAllSanityArtistSlugs, getEventsByArtistRef, getMotsoundPerformerEditions } from "@/lib/sanity";
import { BIO_SLUGS } from "@/lib/events";
import { computeBadges } from "@/lib/badges";
import { isJunkImage } from "@/lib/junk-images";
import { allStudios } from "@/lib/studios";
import ArtistGallery from "./ArtistGallery";
import type { Metadata } from "next";
import { ogImage } from "@/lib/og";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artist = getArtist(slug);
  const sanityArtist = await getArtistBySlug(slug);
  const name = artist?.name || sanityArtist?.name || slug;
  const altNames = (sanityArtist?.alternateNames as string[] | undefined) ?? [];
  // Alternate names/nicknames included so search engines can match this page
  // for either name an artist is known by, not just their primary display name.
  const akaClause = altNames.length > 0 ? ` (also known as ${altNames.join(", ")})` : "";
  const description = `${name}${akaClause}, artist featured in MoT+++ exhibitions and programs in Ho Chi Minh City, Vietnam.`;
  const image = ogImage(sanityArtist?.portrait as string | undefined, name);
  return {
    title: name,
    description,
    keywords: [name, ...altNames, "MoT+++", "Ho Chi Minh City artist", "Vietnam contemporary art"],
    openGraph: {
      title: `${name} | MoT+++`,
      description,
      url: `https://motplusplusplus.com/profiles/${slug}`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | MoT+++`,
      description,
      images: [image.url],
    },
    alternates: { canonical: `https://motplusplusplus.com/profiles/${slug}` },
  };
}

export async function generateStaticParams() {
  const localSlugs = getArtistSlugs();
  const sanitySlugs = await getAllSanityArtistSlugs();
  const all = new Set([...localSlugs, ...sanitySlugs]);
  return Array.from(all).map(slug => ({ slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const localArtist = getArtist(slug);

  // Always fetch Sanity artist (for _id, bio, and Sanity-ref events); fall back to local data
  const isBioSlug = BIO_SLUGS.has(slug);
  // Some profiles draw their documentation gallery from a differently-slugged bio
  // event (consolidated duplicates). Map profile slug → bio-event slug.
  const BIO_EVENT_SLUG: Record<string, string> = { "alex-williams": "pug-alex-williams" };
  const bioEventSlug = BIO_EVENT_SLUG[slug] ?? slug;
  const [sanityArtist, eventEntry, motsound] = await Promise.all([
    getArtistBySlug(slug),
    isBioSlug ? getEventBySlug(bioEventSlug) : Promise.resolve(null),
    getMotsoundPerformerEditions(),
  ]);
  if (!localArtist && !sanityArtist) notFound();

  // Merge: local data wins, Sanity fills gaps
  const artist: Artist = localArtist ?? {
    slug,
    name:       sanityArtist!.name as string,
    collective: false,
    resident:   !!(sanityArtist!.isAfarmResident),
    studioHost: false,
    origin:     ([sanityArtist!.originCity, sanityArtist!.nationality] as string[]).filter(Boolean).join(", "),
    website:    ((sanityArtist!.links?.[0] as { url?: string })?.url ?? "").replace(/^https?:\/\//, ""),
    bio:        "",
    photo:      (sanityArtist!.portrait as string) ?? "",
    workImages: (sanityArtist!.images as string[]) ?? [],
  };

  const rawSanityBio = sanityArtist?.bio;
  const ptBio = Array.isArray(rawSanityBio) ? rawSanityBio as any[] : null;
  const bioText = (localArtist?.bio ?? '') || (typeof rawSanityBio === 'string' ? rawSanityBio : '') || eventEntry?.description || '';
  // Use PT rendering when Sanity returned a block array and no plain-text source overrides it
  const usePtBio = ptBio !== null && !(localArtist?.bio) && !(eventEntry?.description);
  const hasBio = usePtBio || bioText.length > 0;
  const displayDate = eventEntry?.displayDate || "";

  // Gallery images from the bio event entry (documentation photos), junk-filtered
  const eventGallery = (eventEntry?.images ?? []).filter(url => !isJunkImage(url));

  const sanityArtistId = sanityArtist?._id as string | undefined;
  const relatedEvents = sanityArtistId ? await getEventsByArtistRef(sanityArtistId) : [];

  // +1 trash — available works for this artist (via artistRef or artists[], "available" = not sold).
  // The trashItem schema has no "status"/"on hold" field, so "available" mirrors the
  // /trash page's own availability filter (lib: app/trash/TrashPageShell.tsx).
  type ProfileTrashWork = { _id: string; title?: string; medium?: string; year?: number; sold?: boolean; slug?: string; images?: string[] };
  const allTrashWorks = (sanityArtist?.trashItems as ProfileTrashWork[] | undefined) ?? [];
  const availableTrashWorks = allTrashWorks.filter(w => !w.sold && w.slug);
  const trashWorksMissingSlug = allTrashWorks.filter(w => !w.sold && !w.slug);
  if (trashWorksMissingSlug.length > 0) {
    console.warn(
      `[profiles/${slug}] ${trashWorksMissingSlug.length} available +1 trash work(s) have no slug yet, omitted from the available-works section:`,
      trashWorksMissingSlug.map(w => w._id)
    );
  }

  const studio = allStudios.find(s => s.hostSlug === slug);
  // Deceased dates come from the Sanity artist's deathYear/birthYear fields.
  // Shows "birthYear–deathYear" when both exist, or just the death year alone.
  const deathYear = sanityArtist?.deathYear as number | undefined;
  const birthYear = sanityArtist?.birthYear as number | undefined;
  const deceasedDates = deathYear
    ? (birthYear ? `${birthYear}–${deathYear}` : `${deathYear}`)
    : undefined;
  const isDavidWillis = slug === "david-willis";
  const isCamXanh = slug === "cam-xanh";

  const displayName = artist.name;
  const alternateNames = (sanityArtist?.alternateNames as string[] | undefined) ?? [];

  const badges = computeBadges({
    slug,
    role: (sanityArtist?.role as string | undefined) ?? (artist.curator ? "curator" : null),
    hasResidency: !!sanityArtist?.residencyStartDate || !!sanityArtist?.isAfarmResident || artist.resident,
    isPerformancePlus: !!artist.performancePlus,
    motsoundEditions: motsound[slug],
  }).bioBadges;
  if (isCamXanh) badges.push("+1 direct experience");

  // Structured data (schema.org Person) so search engines can index this
  // artist's name(s) directly against the page, not just plain meta tags.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    ...(alternateNames.length > 0 ? { alternateName: alternateNames } : {}),
    url: `https://motplusplusplus.com/profiles/${slug}`,
    ...(artist.photo ? { image: artist.photo } : {}),
    jobTitle: "Artist",
    memberOf: { "@type": "Organization", name: "MoT+++", url: "https://motplusplusplus.com" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify doesn't escape "</script>" sequences; replacing "<"
        // keeps this safe to inline even if a name ever contains one.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* hero — mobile only; desktop uses the framed-portrait block below instead */}
      <div className="profile-hero-mobile-only" style={{
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
              {badges.map(b => {
                const isFounderBadge = b === "founder/director";
                return (
                  <span key={b} style={{
                    fontSize: "10px", letterSpacing: "0.1em",
                    color: isFounderBadge ? "#ff6b5e" : "rgba(255,255,255,0.5)",
                    border: isFounderBadge ? "1px solid rgba(255,107,94,0.6)" : "1px solid rgba(255,255,255,0.2)",
                    padding: "3px 8px",
                  }}>
                    {b}
                  </span>
                );
              })}
            </div>
          )}
          <h1 style={{
            fontSize: "clamp(26px, 4.5vw, 56px)",
            fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em",
            color: deceasedDates ? "rgba(255,255,255,0.7)" : "#ffffff",
            fontStyle: deceasedDates ? "italic" : "normal",
          }}>
            {displayName}
          </h1>
          {alternateNames.length > 0 && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "8px", fontWeight: 300 }}>
              {alternateNames.join(", ")}
            </p>
          )}
          {deceasedDates ? (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "8px", fontWeight: 300 }}>
              {deceasedDates}
            </p>
          ) : artist.origin && (
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "10px", fontWeight: 300 }}>
              {artist.origin}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "52px 24px 96px" }}>

        {/* breadcrumb + hosting artist badge */}
        <div style={{ marginBottom: "52px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <Link href="/profiles" style={{ fontSize: "12px", color: "#767676", letterSpacing: "0.06em" }}>
            ← profiles
          </Link>
          {studio && (
            <Link
              href={`/afarm/studios/${studio.slug}`}
              style={{
                fontSize: "11px",
                color: "#ffffff",
                backgroundColor: "#111111",
                letterSpacing: "0.08em",
                padding: "6px 14px",
                textDecoration: "none",
              }}
            >
              hosting artist — view studio ↗
            </Link>
          )}
        </div>

        {/* framed portrait + identity — desktop only; mobile uses the full-bleed
            hero above instead. A bio photo reads better as a contained portrait
            beside the name than as a viewport-wide banner. */}
        <div className="profile-hero-desktop-only" style={{
          gridTemplateColumns: "1fr minmax(220px, 340px)",
          gap: "48px",
          alignItems: "start",
          marginBottom: "56px",
        }}>
          <div>
            {badges.length > 0 && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
                {badges.map(b => {
                  const isFounderBadge = b === "founder/director";
                  return (
                    <span key={b} style={{
                      fontSize: "10px", letterSpacing: "0.1em",
                      color: isFounderBadge ? "#ff6b5e" : "#999999",
                      border: isFounderBadge ? "1px solid rgba(255,107,94,0.5)" : "1px solid #dddddd",
                      padding: "3px 8px",
                    }}>
                      {b}
                    </span>
                  );
                })}
              </div>
            )}
            {/* h2, not h1 -- the mobile hero above already has the page's one
                real h1; both blocks are always in the DOM (CSS display-toggled
                by viewport, not conditionally rendered), so using h1 here too
                would put two h1 elements on every profile page. */}
            <h2 style={{
              fontSize: "clamp(26px, 4.5vw, 56px)",
              fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em",
              color: deceasedDates ? "#999999" : "#111111",
              fontStyle: deceasedDates ? "italic" : "normal",
            }}>
              {displayName}
            </h2>
            {alternateNames.length > 0 && (
              <p style={{ fontSize: "13px", color: "#767676", marginTop: "8px", fontWeight: 300 }}>
                {alternateNames.join(", ")}
              </p>
            )}
            {deceasedDates ? (
              <p style={{ fontSize: "13px", color: "#767676", marginTop: "8px", fontWeight: 300 }}>
                {deceasedDates}
              </p>
            ) : artist.origin && (
              <p style={{ fontSize: "13px", color: "#767676", marginTop: "10px", fontWeight: 300 }}>
                {artist.origin}
              </p>
            )}
          </div>
          {artist.photo && (
            <img
              src={artist.photo}
              alt={artist.name}
              style={{
                width: "100%", maxWidth: "340px", maxHeight: "420px",
                objectFit: "contain", display: "block",
                border: "1px solid #e5e5e5", backgroundColor: "#f5f5f5",
              }}
            />
          )}
        </div>

        {/* metadata strip */}
        {(displayDate || artist.website || (artist.instagram && artist.instagram.length > 0)) && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "40px",
            borderBottom: "1px solid #e5e5e5", paddingBottom: "40px", marginBottom: "56px",
          }}>
            {displayDate && (
              <div>
                <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  residency
                </p>
                <p style={{ fontSize: "15px", fontWeight: 300, color: "#333333" }}>{displayDate}</p>
              </div>
            )}
            {artist.website && (
              <div>
                <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
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
            {artist.instagram && artist.instagram.length > 0 && (
              <div>
                <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  instagram
                </p>
                {artist.instagram.map((handle) => {
                  const h = handle.replace(/^@/, "");
                  return (
                    <a
                      key={h}
                      href={`https://instagram.com/${h}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "15px", fontWeight: 300, color: "#333333", display: "block" }}
                    >
                      @{h}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* bio */}
        {hasBio && (
          <div style={{ maxWidth: "680px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "28px" }}>
              practice
            </p>
            {usePtBio ? (
              <PortableText
                value={ptBio!}
                components={{
                  block: {
                    normal: ({ children }) => (
                      <p style={{ fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px" }}>
                        {children}
                      </p>
                    ),
                  },
                  marks: {
                    link: ({ children, value }) => (
                      <a
                        href={value?.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#444444", textDecoration: "underline" }}
                      >
                        {children}
                      </a>
                    ),
                  },
                }}
              />
            ) : (
              bioText.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p key={i} style={{
                  fontSize: "15px", lineHeight: 1.85, color: "#444444", marginBottom: "20px",
                }}>
                  {para.trim()}
                </p>
              ))
            )}
            {isDavidWillis && (
              <Link
                href="/afarm/retreat"
                style={{
                  display: "inline-block",
                  fontSize: "13px",
                  color: "#111111",
                  borderBottom: "1px solid #111111",
                  paddingBottom: "2px",
                  marginTop: "8px",
                }}
              >
                a.farm saigon artist intensive retreat — aug. 22–28, 2026 →
              </Link>
            )}
            {isCamXanh && (
              <Link
                href="/directexperience"
                style={{
                  display: "inline-block",
                  fontSize: "13px",
                  color: "#111111",
                  borderBottom: "1px solid #111111",
                  paddingBottom: "2px",
                  marginTop: "8px",
                }}
              >
                +1 direct experience →
              </Link>
            )}
          </div>
        )}

        {/* +1 trash — available works */}
        {availableTrashWorks.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "32px" }}>
              +1 trash — available works
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "32px 20px",
            }}>
              {availableTrashWorks.map(work => (
                <Link
                  key={work._id}
                  href={`/trash/${work.slug}`}
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <div style={{ aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f5f5f5", marginBottom: "10px" }}>
                    {work.images?.[0] ? (
                      <img
                        src={work.images[0]}
                        alt={work.title || ""}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : null}
                  </div>
                  <p style={{ fontSize: "13px", color: "#333333", lineHeight: 1.4 }}>
                    {work.title}{work.year ? `, ${work.year}` : ""}
                  </p>
                  {work.medium && (
                    <p style={{ fontSize: "11px", color: "#767676", marginTop: "2px" }}>{work.medium}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* work images (collective members) */}
        {artist.workImages.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "32px" }}>
              work
            </p>
            <ArtistGallery images={artist.workImages} artistName={artist.name} />
          </div>
        )}

        {/* documentation gallery from bio event entry (a.Farm residents) */}
        {eventGallery.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "32px" }}>
              documentation
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "8px",
            }}>
              {eventGallery.map((img, i) => (
                <div key={i} style={{
                  width: "100%", aspectRatio: "4/3", overflow: "hidden", backgroundColor: "#f0f0f0",
                }}>
                  <img
                    src={img}
                    alt={`${artist.name} — ${i + 1}`}
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
            <p style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.08em", marginBottom: "28px" }}>
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
                      <p style={{ fontSize: "10px", color: "#767676", letterSpacing: "0.06em", marginBottom: "4px" }}>
                        {evt.category}
                      </p>
                      <p style={{ fontSize: "14px", fontWeight: 300, color: "#111111", lineHeight: 1.35 }}>
                        {evt.title}
                      </p>
                    </div>
                    <p style={{ fontSize: "12px", color: "#767676", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {evt.displayDate || evt.dateISO}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* if no bio and no events: minimal state */}
        {!hasBio && relatedEvents.length === 0 && (
          <div style={{ marginBottom: "80px" }}>
            <p style={{ fontSize: "14px", color: "#767676", fontWeight: 300 }}>
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
          <Link href="/profiles" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to profiles
          </Link>
          {studio ? (
            <Link
              href={`/afarm/studios/${studio.slug}`}
              style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.06em" }}
            >
              view studio ↗
            </Link>
          ) : artist.collective && (
            <Link
              href={`/collective#${artist.name.toLowerCase().replace(/\s+/g, "-")}`}
              style={{ fontSize: "11px", color: "#767676", letterSpacing: "0.06em" }}
            >
              view on collective page ↗
            </Link>
          )}
        </div>

      </div>
    </>
  );
}
