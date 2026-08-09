import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTrashItemBySlug, getAllTrashItemSlugs } from "@/lib/sanity";
import { buildTrashInquiryEmail, type TrashItem } from "@/lib/demoTrashItems";
import ArtistCreditLinks from "@/components/ArtistCreditLinks";
import InquiryForm from "@/components/InquiryForm";
import ShareActions from "@/components/ShareActions";
import { CONTACTS } from "@/lib/contacts";
import { ogImage } from "@/lib/og";

function artistLabel(raw: { artist: string; artists?: { name: string }[] | null }) {
  const names = (raw.artists ?? []).filter(Boolean).map(a => a.name);
  return names.length > 0 ? names.join(" & ") : raw.artist;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getTrashItemBySlug(slug);
  if (!raw) return {};

  const label = artistLabel(raw);
  const images = [...(raw.directImageUrls ?? []), ...(raw.legacyImageUrls ?? [])];
  const title = `${raw.title || "untitled"} — ${label} | +1 trash`;
  const socialTitle = `${title} | MoT+++`;
  const descParts = [label, raw.medium, raw.year ? String(raw.year) : null].filter(Boolean);
  const description = `${descParts.join(" — ")} — available through +1 trash, MoT+++'s artwork acquisition program in Ho Chi Minh City, Vietnam.`;
  const image = ogImage(images[0], `${raw.title || "untitled"} by ${label}`);

  return {
    title,
    description,
    openGraph: {
      title: socialTitle,
      description,
      url: `https://motplusplusplus.com/trash/${slug}`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image.url],
    },
    alternates: { canonical: `https://motplusplusplus.com/trash/${slug}` },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllTrashItemSlugs();
  // output:"export" hard-fails the whole build if a dynamic route resolves to zero
  // paths (treated identically to a missing generateStaticParams). Guard against that
  // until at least one trashItem has a published slug — the placeholder 404s via the
  // !raw check below instead of taking down every other page's deploy.
  if (slugs.length === 0) return [{ slug: "_none" }];
  return slugs.map(slug => ({ slug }));
}

export default async function TrashItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = await getTrashItemBySlug(slug);
  if (!raw) notFound();

  const item: TrashItem = {
    _id: raw._id,
    artist: raw.artist,
    artistSlug: raw.artistSlug ?? null,
    artists: (raw.artists ?? []).filter(Boolean),
    slug: raw.slug,
    title: raw.title ?? "",
    medium: raw.medium ?? "",
    year: raw.year ?? 0,
    dimensions: raw.dimensions ?? "",
    edition: raw.edition ?? "",
    description: raw.description ?? "",
    images: [...(raw.directImageUrls ?? []), ...(raw.legacyImageUrls ?? [])],
    youtubeUrls: raw.youtubeUrls ?? [],
    museumLocationId: raw.museumLocationId,
    neighbourhood: raw.neighbourhood,
    sold: raw.sold ?? false,
    // price is intentionally omitted: this page never displays it (it shows
    // "price on inquiry"), and serializing it would leak the value into the
    // public static payload with no gate at all.
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "64px 24px" }}>
      <Link href="/trash" style={{ fontSize: "12px", color: "#767676", letterSpacing: "0.06em" }}>
        ← back to all works
      </Link>

      <div style={{ marginTop: "32px" }}>
        {item.images.length > 0 && (
          <div style={{ backgroundColor: "#f5f5f5", marginBottom: "32px" }}>
            <img
              src={item.images[0]}
              alt={item.title}
              style={{ width: "100%", maxHeight: "640px", objectFit: "contain", display: "block" }}
            />
          </div>
        )}

        <p style={{ fontSize: "12px", color: "#767676", letterSpacing: "0.07em", marginBottom: "10px", textTransform: "uppercase" }}>
          <ArtistCreditLinks artists={item.artists} artistSlug={item.artistSlug} fallback={item.artist} />
        </p>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 300, lineHeight: 1.2, marginBottom: "16px", color: "#111111" }}>
          {item.title}{item.year ? `, ${item.year}` : ""}
        </h1>
        <p style={{ fontSize: "14px", color: "#767676", lineHeight: 1.7, marginBottom: "8px" }}>
          {[item.medium, item.dimensions, item.edition].filter(Boolean).join(" · ")}
        </p>
        {item.neighbourhood && (
          <p style={{ fontSize: "13px", color: "#767676", marginBottom: "20px" }}>
            currently placed — {item.neighbourhood}
          </p>
        )}
        {item.description && (
          <p style={{ fontSize: "15px", color: "#555555", lineHeight: 1.85, marginBottom: "32px", maxWidth: "640px" }}>
            {item.description}
          </p>
        )}

        {item.youtubeUrls && item.youtubeUrls.length > 0 && (
          <div style={{ marginBottom: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {item.youtubeUrls.map((url) => (
              <div key={url} style={{ position: "relative", width: "100%", paddingBottom: "56.25%", height: 0, overflow: "hidden", backgroundColor: "#000000" }}>
                <iframe
                  src={url}
                  title={item.title}
                  frameBorder="0"
                  allowFullScreen
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", borderTop: "1px solid #eeeeee", paddingTop: "28px" }}>
          {item.sold ? (
            <span style={{ fontSize: "14px", color: "#cc2222", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ fontSize: "18px", lineHeight: 1 }}>●</span> sold
            </span>
          ) : (
            <>
              <InquiryForm
                type="trash"
                recipient={CONTACTS.sales}
                mailtoHref={buildTrashInquiryEmail(item)}
                artworkTitle={item.title}
                artworkId={item._id}
                buttonLabel="inquire"
                buttonStyle={{ fontSize: "13px", color: "#ffffff", backgroundColor: "#111111", padding: "10px 22px", letterSpacing: "0.03em" }}
              />
              <span style={{ fontSize: "13px", color: "#767676", letterSpacing: "0.03em" }}>
                price on inquiry
              </span>
            </>
          )}
          {item.museumLocationId && (
            <Link
              href={`/museum?work=${item.museumLocationId}`}
              style={{ fontSize: "12px", color: "#333333", border: "1px solid #cccccc", padding: "8px 18px", textDecoration: "none", letterSpacing: "0.03em" }}
            >
              +1 museum by any other name
            </Link>
          )}
          <ShareActions
            url={`https://motplusplusplus.com/trash/${slug}/`}
            title={`${item.title} by ${artistLabel(raw)}`}
            text="via +1 trash, MoT+++"
          />
        </div>

        <div style={{ marginTop: "48px", borderTop: "1px solid #f0f0f0", paddingTop: "32px" }}>
          <Link href="/trash" style={{ fontSize: "13px", color: "#666666" }}>
            ← back to all works
          </Link>
        </div>
      </div>
    </div>
  );
}
