/** /events/[slug] (2026-11-22 redesign). Images first: a large cover (never a
 *  logo, never a poster: E5, E8), then one compact monospace block (title, VN
 *  title, dates, venue with a map link, category, credits, partners), the text
 *  with an EN / VN switch and "read more", the full gallery and videos in the
 *  viewer, and related rows that collapse when empty (E12). */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalogue, type CEvent, type Credit, type Img } from '@/lib/catalogue';
import { toEntry, type EventEntry } from '@/lib/eventEntry';
import { fromText, plainOf } from '@/lib/prose';
import { isAvailable } from '@/lib/trashWork';
import { normalizeDisplayDate, BIO_SLUGS, HIDDEN_SLUGS } from '@/lib/events';
import WarmPage from '@/components/work/WarmPage';
import { CImg, TypeCard, imgSrc } from '@/components/cat/Pieces';
import HeartButton from '@/components/ui/HeartButton';
import Correction from '@/components/ui/Correction';
import GalleryGrid from '@/components/ui/GalleryGrid';
import { toGalleryItems, type GItem } from '@/lib/galleryItems';
import ProfileWorks from '@/components/work/ProfileWorks';
import { Visited } from '@/app/profiles/[slug]/ProfileIslands';
import { EventText, Hero } from './EventIslands';
import ClickToPlay from '@/components/ui/ClickToPlay';

const SEE_ALSO: Record<string, string[]> = {
  'all-animals-are-equal-1': ['all-animals-are-equal-2'],
  'all-animals-are-equal-2': ['all-animals-are-equal-1'],
};

export async function generateStaticParams() {
  const c = await getCatalogue();
  // same set as before the redesign: every Sanity and JSON event minus bio pages and hidden slugs
  return c.events.filter(e => !BIO_SLUGS.has(e.slug) && !HIDDEN_SLUGS.has(e.slug)).map(e => ({ slug: e.slug }));
}

function description(e: CEvent): string {
  const t = plainOf(fromText(e.description)).replace(/\s+/g, ' ').trim();
  const lead = [e.displayDate || e.dateISO, e.venue?.name || (e.location && !/^hồ chí minh$/i.test(e.location) ? e.location : ''), e.category].filter(Boolean).join(' · ');
  const body = t.length > 150 - lead.length ? t.slice(0, 150 - lead.length).replace(/\s+\S*$/, '') + '…' : t;
  return [lead, body].filter(Boolean).join(': ').slice(0, 165);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCatalogue();
  const e = c.eventsBySlug.get(slug);
  if (!e) return {};
  const desc = description(e);
  const og = e.cover && !e.coverIsPoster
    ? { url: e.cover.url.startsWith('https://cdn.sanity.io/') ? `${e.cover.url}?w=1200&h=630&fit=crop&crop=focalpoint&fp-x=${e.cover.fx ?? 0.5}&fp-y=${e.cover.fy ?? 0.5}&fm=jpg&q=80` : e.cover.url, width: 1200, height: 630, alt: e.title }
    : e.cover ? { url: e.cover.url, alt: e.title } : { url: 'https://motplusplusplus.com/og-default.jpg', width: 1200, height: 630, alt: 'MoT+++' };
  const title = `${e.title}${e.year ? ` (${e.year})` : ''}`;
  return {
    title,
    description: desc,
    openGraph: { title: `${title} · MoT+++`, description: desc, url: `https://motplusplusplus.com/events/${slug}/`, images: [og], type: 'article' },
    twitter: { card: 'summary_large_image', title: `${title} · MoT+++`, description: desc, images: [og.url] },
    alternates: { canonical: `https://motplusplusplus.com/events/${slug}/` },
  };
}

function Name({ c }: { c: Credit }) {
  return c.person.linked ? <a href={`/profiles/${c.person.slug}/`}>{c.person.name}</a> : <>{c.person.name}</>;
}
function names(list: Credit[], suffix?: (c: Credit) => string) {
  return list.map((c, i) => <span key={c.person._id + c.role}>{i ? ', ' : ''}<Name c={c} />{suffix ? ` (${suffix(c)})` : ''}</span>);
}

function MiniCard({ e }: { e: EventEntry }) {
  return (
    <a className="c-card" href={`/events/${e.slug}/`}>
      {e.cover ? <CImg img={e.cover} sizes="(min-width: 760px) 18vw, 42vw" alt="" /> : <TypeCard name={e.title} facts={String(e.year || '')} />}
      <span className="c-card-title" style={{ fontSize: 13 }}>{e.title}</span>
      <span className="c-card-meta c-mono c-quiet">{e.year || ''}</span>
    </a>
  );
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCatalogue();
  const e = c.eventsBySlug.get(slug);
  if (!e || BIO_SLUGS.has(slug) || HIDDEN_SLUGS.has(slug)) notFound();

  const curators = e.credits.filter(x => x.role === 'curator');
  const artists = e.credits.filter(x => x.role === 'artist' || !x.role);
  const writers = e.credits.filter(x => x.role === 'writer');
  const others = e.credits.filter(x => x.role && !['curator', 'artist', 'writer'].includes(x.role));
  const where = e.venue?.name || e.location || '';
  const address = e.venue ? [e.venue.address, e.venue.city].filter(Boolean).join(', ') : '';
  const mapUrl = e.venue?.mapUrl || (address || where ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([where, address].filter(Boolean).join(', '))}` : null);
  const date = normalizeDisplayDate(e.displayDate) || e.displayDate || e.dateISO;

  // gallery: hero (a real photo) first, then the rest, posters included, then videos
  const heroImg: Img | null = e.cover && !e.coverIsPoster ? e.cover : null;
  const rest: GItem[] = e.images.filter(i => i !== heroImg);
  const videos: GItem[] = e.videos.map(v => ({ url: '', video: v, caption: e.title }));
  const all: GItem[] = [...(heroImg ? [heroImg] : []), ...rest, ...videos];

  // E12: related rows, each hidden when empty
  const ids = new Set(e.credits.map(x => x.person._id));
  const sameArtists = ids.size ? c.listed.filter(o => o.slug !== slug && o.credits.some(x => ids.has(x.person._id))).slice(0, 8) : [];
  const works = [...new Map(e.credits.flatMap(x => (x.person.slug ? c.worksByPerson.get(x.person.slug) ?? [] : [])).filter(w => isAvailable(w) && w.images.length && w.slug).map(w => [w._id, w])).values()].slice(0, 12);
  const sameProgram = e.category ? c.listed.filter(o => o.slug !== slug && o.category === e.category && !sameArtists.includes(o)).slice(0, 8) : [];
  const seeAlso = (SEE_ALSO[slug] ?? []).map(s => c.eventsBySlug.get(s)).filter(Boolean) as CEvent[];
  const i = c.listed.findIndex(o => o.slug === slug);
  const newer = i > 0 ? c.listed[i - 1] : null;
  const older = i >= 0 && i < c.listed.length - 1 ? c.listed[i + 1] : null;

  const multiDay = !!e.endDateISO && e.endDateISO > e.dateISO;
  const isExhibition = multiDay && !/motsound|performance/i.test(e.category);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isExhibition ? 'ExhibitionEvent' : 'Event',
    name: e.title,
    ...(e.vnTitle ? { alternateName: e.vnTitle } : {}),
    url: `https://motplusplusplus.com/events/${slug}/`,
    ...(e.dateISO ? { startDate: e.dateISO } : {}),
    ...(e.endDateISO ? { endDate: e.endDateISO } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: where || 'Ho Chi Minh City',
      address: { '@type': 'PostalAddress', ...(address ? { streetAddress: e.venue?.address ?? undefined } : {}), addressLocality: e.venue?.city || 'Ho Chi Minh City', addressCountry: e.venue?.country || 'VN' },
    },
    ...(heroImg || e.cover ? { image: imgSrc((heroImg ?? e.cover)!, 1200) } : {}),
    description: description(e),
    organizer: { '@type': 'Organization', name: 'MoT+++', url: 'https://motplusplusplus.com' },
    ...(e.credits.length ? {
      performer: [...artists, ...others].map(x => ({ '@type': 'Person', name: x.person.name, ...(x.person.linked ? { url: `https://motplusplusplus.com/profiles/${x.person.slug}/` } : {}) })),
    } : {}),
    ...(curators.length ? { contributor: curators.map(x => ({ '@type': 'Person', name: x.person.name })) } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <WarmPage />
      <Visited item={{ id: `e:${slug}`, href: `/events/${slug}/`, title: e.title, thumb: e.cover ? imgSrc(e.cover, 96) : null }} />
      <div className="c-wrap">
        {heroImg
          ? <Hero items={toGalleryItems(all)} title={e.title}><CImg img={heroImg} sizes="(min-width: 1280px) 1216px, 100vw" widths={[640, 960, 1280, 1600, 2000]} alt={heroImg.alt || e.title} priority minFill={480} /></Hero>
          : <div className="c-ev-hero c-ev-type" style={{ cursor: 'default' }}><TypeCard name={e.title} facts={[e.year, e.category].filter(Boolean).join(' · ')} big /></div>}
        {heroImg?.credit && <p className="c-mono c-quiet" style={{ margin: '6px 0 0' }}>photo: {heroImg.credit}</p>}

        <div className="c-ev-block">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <h1 className="c-ev-title" data-ev-title style={{ flex: 1 }}>{e.title}</h1>
            <HeartButton id={`e:${slug}`} label={e.title} />
          </div>
          {e.vnTitle && e.vnTitle !== e.title && <p className="c-ev-vn" lang="vi">{e.vnTitle}</p>}
          <dl className="c-ev-dl">
            {date && <div><dt>when</dt><dd>{date}</dd></div>}
            {where && <div><dt>where</dt><dd>{mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">{where}{address ? `, ${address}` : ''}</a> : where}</dd></div>}
            {e.category && <div><dt>program</dt><dd>{e.category}</dd></div>}
            {curators.length > 0 && <div><dt>curated by</dt><dd>{names(curators)}</dd></div>}
            {artists.length > 0 && <div><dt>artists</dt><dd>{names(artists)}</dd></div>}
            {others.length > 0 && <div><dt>with</dt><dd>{names(others, x => x.role)}</dd></div>}
            {writers.length > 0 && <div><dt>text</dt><dd>{names(writers)}</dd></div>}
            {e.wpLink && <div><dt>archive</dt><dd><a href={e.wpLink} target="_blank" rel="noopener noreferrer">original post</a></dd></div>}
            {e.partners.length > 0 && <div><dt>partners</dt><dd>{e.partners.map((p, k) => <span key={p.name}>{k ? ', ' : ''}{p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.name}</a> : p.name}{p.role ? ` (${p.role})` : ''}</span>)}</dd></div>}
          </dl>
        </div>

        <EventText en={fromText(e.description)} vn={fromText(e.vnDescription)} titleEn={e.title} titleVn={e.vnTitle ?? null} />

        {e.bandcampAlbumId && (
          <div className="c-sec" style={{ maxWidth: 700 }}>
            <ClickToPlay bandcampAlbumId={e.bandcampAlbumId} title={`${e.title} on Bandcamp`} height={120} />
          </div>
        )}

        {(rest.length > 0 || videos.length > 0) && (
          <section className="c-sec" aria-labelledby="eg-h">
            <div className="c-sec-h"><h2 id="eg-h">{videos.length && !rest.length ? 'video' : 'images'} · {rest.length + videos.length}</h2></div>
            <GalleryGrid items={[...rest, ...videos]} all={all} offset={heroImg ? 1 : 0} title={e.title} autoOpen={!heroImg} captions />
          </section>
        )}

        {works.length > 0 && <div className="c-sec"><ProfileWorks title="works by these artists · available" works={works} /></div>}

        {sameArtists.length > 0 && (
          <section className="c-sec" aria-labelledby="es-h">
            <div className="c-sec-h"><h2 id="es-h">same artists</h2></div>
            <div className="c-row">{sameArtists.map(o => <MiniCard key={o.slug} e={toEntry(o)} />)}</div>
          </section>
        )}
        {seeAlso.length > 0 && (
          <section className="c-sec" aria-labelledby="ea-h">
            <div className="c-sec-h"><h2 id="ea-h">see also</h2></div>
            <div className="c-row">{seeAlso.map(o => <MiniCard key={o.slug} e={toEntry(o)} />)}</div>
          </section>
        )}
        {sameProgram.length > 0 && (
          <section className="c-sec" aria-labelledby="ep-h">
            <div className="c-sec-h"><h2 id="ep-h">more {e.category}</h2></div>
            <div className="c-row">{sameProgram.map(o => <MiniCard key={o.slug} e={toEntry(o)} />)}</div>
          </section>
        )}

        {(newer || older) && (
          <nav className="c-prevnext" aria-label="archive">
            {older ? <a href={`/events/${older.slug}/`} rel="prev" data-nav="prev"><span className="c-mono">← earlier</span>{older.title}</a> : <span />}
            {newer ? <a href={`/events/${newer.slug}/`} rel="next" data-nav="next"><span className="c-mono">later →</span>{newer.title}</a> : <span />}
          </nav>
        )}

        <Correction pageTitle={e.title} />
      </div>
    </>
  );
}
