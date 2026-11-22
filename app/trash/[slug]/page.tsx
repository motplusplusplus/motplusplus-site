import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTrashItemBySlug, getAllTrashItemSlugs, getAllPublicWorks } from "@/lib/sanity";
import ArtistCreditLinks from "@/components/ArtistCreditLinks";
import ShareButton from "@/components/work/ShareButton";
import HeartButton from "@/components/ui/HeartButton";
import WorkPageImages from "@/components/work/WorkPageImages";
import ScaleDrawing from "@/components/work/ScaleDrawing";
import RelatedRow from "@/components/work/RelatedRow";
import WarmPage from "@/components/work/WarmPage";
import { inquiryMailto, isAvailable, normalizeWork, type Work } from "@/lib/trashWork";
import { isSanityImage, ogImageUrl } from "@/lib/workImage";
import { DEFAULT_OG_IMAGE } from "@/lib/og";

const SITE = "https://motplusplusplus.com";
const SHARE_DESCRIPTION = "+1 trash · MoT+++";

async function load(slug: string) {
  const raw = await getTrashItemBySlug(slug);
  if (!raw) return null;
  const work = normalizeWork(raw);
  if (!work) return null;
  return { raw, work };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) return {};
  const { work } = found;
  // Messenger previews (Zalo, WhatsApp, Facebook, Instagram DMs) read these:
  // "title, artist" + the work itself, letterboxed 1200x630 JPEG, never cropped.
  const title = `${work.title}, ${work.artist}`;
  const url = `${SITE}/trash/${slug}/`;
  // Sanity photos are letterboxed to 1200x630; a YouTube still or legacy
  // image is passed as it is, with its real size.
  const first = work.images[0];
  const image = !first
    ? { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "MoT+++" }
    : isSanityImage(first.url)
      ? { url: ogImageUrl(first.url), width: 1200, height: 630, alt: first.alt, type: "image/jpeg" }
      : { url: first.url, width: first.w, height: first.h, alt: first.alt };
  const description = [work.medium, work.year ? String(work.year) : null].filter(Boolean).join(", ");
  return {
    title: { absolute: `${title} | +1 trash | MoT+++` },
    description: description ? `${title}. ${description}. ${SHARE_DESCRIPTION}` : `${title}. ${SHARE_DESCRIPTION}`,
    openGraph: { type: "article", siteName: "MoT+++", title, description: SHARE_DESCRIPTION, url, images: [image] },
    twitter: { card: "summary_large_image", title, description: SHARE_DESCRIPTION, images: [image.url] },
    alternates: { canonical: url },
  };
}

export async function generateStaticParams() {
  const slugs = await getAllTrashItemSlugs();
  // output:"export" hard-fails the build if a dynamic route resolves to zero
  // paths; the placeholder 404s via the null check below.
  if (slugs.length === 0) return [{ slug: "_none" }];
  return slugs.map(slug => ({ slug }));
}

/** More by the same artist first, then the same work type; never itself. */
async function relatedFor(work: Work): Promise<{ sameArtist: Work[]; sameType: Work[] }> {
  const all = ((await getAllPublicWorks()) as unknown[])
    .map((r, i) => normalizeWork(r, i))
    .filter((w): w is Work => !!w && w._id !== work._id && !!w.slug && w.images.length > 0);
  const artistKeys = new Set([
    work.artistSlug, ...work.artists.map(a => a.slug), work.artist.toLowerCase(),
  ].filter(Boolean) as string[]);
  const byArtist = (w: Work) =>
    [w.artistSlug, ...w.artists.map(a => a.slug), w.artist.toLowerCase()].some(k => k && artistKeys.has(k));
  const sameArtist = all.filter(byArtist).slice(0, 10);
  const taken = new Set(sameArtist.map(w => w._id));
  const sameType = all
    .filter(w => !taken.has(w._id) && w.workType.some(t => work.workType.includes(t)))
    // listed (for sale or sold) +1 trash works lead the type row
    .sort((a, b) => Number(a.notForSale) - Number(b.notForSale))
    .slice(0, 12);
  return { sameArtist, sameType };
}

export default async function TrashItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) notFound();
  const { raw, work } = found;
  const { sameArtist, sameType } = await relatedFor(work);
  const bio: { name?: string; slug?: string; bio?: string } | null = raw.artistBio ?? null;
  const bioText = typeof bio?.bio === "string" ? bio.bio.trim() : "";
  const backHref = work.notForSale && work.artistSlug ? `/profiles/${work.artistSlug}` : "/trash";
  const backLabel = work.notForSale && work.artistSlug ? work.artist : "+1 trash";

  return (
    <div className="mot-warm wp">
      <WarmPage />
      <Link href={backHref} prefetch={false} className="mot-mono mot-back">← {backLabel}</Link>

      <WorkPageImages work={work} />

      <div className="wp-body">
        <div className="wp-caption">
          <p className="mot-mono wp-artist">
            <ArtistCreditLinks artists={work.artists} artistSlug={work.artistSlug} fallback={work.artist} prefetch={false} />
          </p>
          <h1 className="wp-title">
            {work.title}{work.year ? <span className="wp-year">, {work.year}</span> : null}
          </h1>
          <dl className="mot-mono wp-dl">
            {work.medium && <div><dt>medium</dt><dd>{work.medium}</dd></div>}
            {work.dimensionsText && <div><dt>size</dt><dd>{work.dimensionsText}</dd></div>}
            {work.edition && <div><dt>edition</dt><dd>{work.edition}</dd></div>}
            {work.neighbourhood && <div><dt>placed</dt><dd>{work.neighbourhood}</dd></div>}
          </dl>

          <div className="wp-actions">
            {work.sold && (
              <span className="mot-mono wp-sold"><span className="mot-dot" aria-hidden="true" />sold</span>
            )}
            {isAvailable(work) && (
              <>
                <a className="mot-btn mot-btn-solid" href={inquiryMailto(work)}>inquire</a>
                <span className="mot-mono mot-quiet">price on inquiry</span>
              </>
            )}
            <ShareButton url={`${SITE}/trash/${slug}/`} title={`${work.title}, ${work.artist}`} />
            <HeartButton id={`w:${slug}`} label={work.title} />
          </div>
        </div>

        {work.dims && <ScaleDrawing dims={work.dims} />}

        {work.description ? (
          <p className="wp-statement">{work.description}</p>
        ) : bioText && bio?.slug ? (
          <div className="wp-bio">
            <p className="wp-bio-text">{bioText}</p>
            <Link href={`/profiles/${bio.slug}`} className="mot-mono mot-link">
              more on {bio.name ?? work.artist} →
            </Link>
          </div>
        ) : null}

        {/* players here only when the page's images are photos; a video-only
            work plays in place of its still at the top (WorkPageImages) */}
        {work.youtubeUrls.length > 0 && !work.images.some(i => i.video) && (
          <div className="wp-videos">
            {work.youtubeUrls.map(url => (
              <div key={url} className="wp-video">
                <iframe src={url} title={`${work.title}, ${work.artist}`} loading="lazy" allowFullScreen />
              </div>
            ))}
          </div>
        )}

        {work.shownIn.length > 0 && (
          <div className="wp-shown">
            <h2 className="mot-mono mot-label">shown in</h2>
            <ul>
              {work.shownIn.map(e => (
                <li key={e.slug}><Link href={`/events/${e.slug}`} prefetch={false} className="mot-link">{e.title}</Link></li>
              ))}
            </ul>
          </div>
        )}

        {work.museumLocationId && (
          <Link href={`/museum?work=${work.museumLocationId}`} prefetch={false} className="mot-mono mot-link wp-museum">
            +1 museum by any other name →
          </Link>
        )}
      </div>

      <RelatedRow title={`more by ${work.artist}`} works={sameArtist} />
      <RelatedRow title="more like this" works={sameType} />

      <div className="wp-foot">
        <Link href="/trash" prefetch={false} className="mot-mono mot-link">all +1 trash works →</Link>
      </div>
    </div>
  );
}
