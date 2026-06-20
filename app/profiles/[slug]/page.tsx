import { notFound } from "next/navigation";
import Link from "next/link";
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
  const description = `${name} — artist featured in MoT+++ exhibitions and programs in Ho Chi Minh City, Vietnam.`;
  const image = ogImage(sanityArtist?.portrait as string | undefined, name);
  return {
    title: name,
    description,
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
    bio:        (sanityArtist!.bio as string) ?? "",
    photo:      (sanityArtist!.portrait as string) ?? "",
    workImages: (sanityArtist!.images as string[]) ?? [],
  };

  const bioText = artist.bio || (sanityArtist?.bio as string) || eventEntry?.description || "";
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

  // Cam Xanh: full name on the bio page, "Cam Xanh" on the listing card.
  const displayName = slug === "cam-xanh" ? "Tran Thi Thanh Ha (Cam Xanh)" : artist.name;

  const badges = computeBadges({
    slug,
    role: (sanityArtist?.role as string | undefined) ?? (artist.curator ? "curator" : null),
    hasResidency: !!sanityArtist?.residencyStartDate || !!sanityArtist?.isAfarmResident || artist.resident,
    isPerformancePlus: !!artist.performancePlus,
    motsoundEditions: motsound[slug],
  }).bioBadges;
  if (isCamXanh) badges.push("+1 direct experience");

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
          <Link href="/profiles" style={{ fontSize: "12px", color: "#999999", letterSpacing: "0.06em" }}>
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
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
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
                    <p style={{ fontSize: "11px", color: "#aaaaaa", marginTop: "2px" }}>{work.medium}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* work images (collective members) */}
        {artist.workImages.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
              work
            </p>
            <ArtistGallery images={artist.workImages} artistName={artist.name} />
          </div>
        )}

        {/* documentation gallery from bio event entry (a.Farm residents) */}
        {eventGallery.length > 0 && (
          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "48px", marginBottom: "80px" }}>
            <p style={{ fontSize: "11px", color: "#999999", letterSpacing: "0.08em", marginBottom: "32px" }}>
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
          <Link href="/profiles" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to profiles
          </Link>
          {studio ? (
            <Link
              href={`/afarm/studios/${studio.slug}`}
              style={{ fontSize: "11px", color: "#aaaaaa", letterSpacing: "0.06em" }}
            >
              view studio ↗
            </Link>
          ) : artist.collective && (
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
