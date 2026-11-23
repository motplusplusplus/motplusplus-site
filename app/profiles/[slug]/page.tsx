/** /profiles/[slug] (2026-11-22 redesign). Portrait left, bio right on desktop;
 *  stacked on phones. Bio shows ~120 words then "read more"; a fact block built
 *  only from data we hold (empty items drop out); then available works, works,
 *  media, events (3 cards + a timeline), links, related people, and the
 *  correction link. Contact fields are never shown. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalogue, creditLabel, type CEvent, type Img, type Person } from '@/lib/catalogue';
import { getAllStudios } from '@/lib/studios';
import { residencyLabel, NON_RESIDENCY_BIO_SLUGS } from '@/lib/events';
import { countryName } from '@/lib/countries';
import { FOUNDER_SLUGS } from '@/lib/badges';
import { DISCIPLINE_LABELS } from '@/lib/disciplines';
import { toParas, plainOf } from '@/lib/prose';
import { fold } from '@/lib/fold';
import { isAvailable, type Work } from '@/lib/trashWork';
import { ogImageUrl } from '@/lib/workImage';
import WarmPage from '@/components/work/WarmPage';
import ProfileWorks from '@/components/work/ProfileWorks';
import { CImg, TypeCard, imgSrc } from '@/components/cat/Pieces';
import Prose from '@/components/ui/Prose';
import HeartButton from '@/components/ui/HeartButton';
import Correction from '@/components/ui/Correction';
import NotifyMe from '@/components/ui/NotifyMe';
import GalleryGrid from '@/components/ui/GalleryGrid';
import { PortraitButton, Timeline, Visited } from './ProfileIslands';

const BIO_EVENT_SLUG: Record<string, string> = { 'alex-williams': 'pug-alex-williams' };
const CONTACT = /^(mailto:|tel:|sms:)|wa\.me\/|zalo\.me\//i;

export async function generateStaticParams() {
  const c = await getCatalogue();
  return c.people.map(p => ({ slug: p.slug }));
}

function describe(p: Person, c: Awaited<ReturnType<typeof getCatalogue>>): string {
  const bio = plainOf(toParas(p.bio)).replace(/\s+/g, ' ').trim();
  if (p.isLena) return `${p.name} in the MoTcyclopedia of MoT+++, Ho Chi Minh City.`;
  if (bio.length > 60) return bio.length > 158 ? bio.slice(0, 155).replace(/\s+\S*$/, '') + '…' : bio;
  const facts = [p.labels.slice(0, 2).join(', '), p.programs.length ? `with MoT+++ (${p.programs.join(', ')})` : 'with MoT+++', p.eventSlugs.length ? `${p.eventSlugs.length} events` : '', p.nationalities.map(countryName).join(' / ')].filter(Boolean).join(', ');
  return `${p.name}: ${facts}. MoTcyclopedia, MoT+++ Ho Chi Minh City.`.slice(0, 160);
  void c;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCatalogue();
  const p = c.peopleBySlug.get(slug);
  if (!p) return {};
  const tile = c.tiles.get(slug);
  const description = describe(p, c);
  const img = !p.isLena && tile ? { url: tile.img.url.startsWith('https://cdn.sanity.io/') ? `${tile.img.url}?w=1200&h=630&fit=crop&crop=focalpoint&fp-x=${tile.img.fx ?? 0.5}&fp-y=${tile.img.fy ?? 0.4}&fm=jpg&q=80` : tile.img.url, width: 1200, height: 630, alt: p.name } : { url: 'https://motplusplusplus.com/og-default.jpg', width: 1200, height: 630, alt: 'MoT+++' };
  const title = p.aliases.length ? `${p.name} (${p.aliases[0]})` : p.name;
  return {
    title: `${title} · MoTcyclopedia`,
    description,
    openGraph: { title: `${title} · MoTcyclopedia · MoT+++`, description, url: `https://motplusplusplus.com/profiles/${slug}/`, images: [img], type: 'profile' },
    twitter: { card: 'summary_large_image', title: `${title} · MoTcyclopedia`, description, images: [img.url] },
    alternates: { canonical: `https://motplusplusplus.com/profiles/${slug}/` },
  };
}

const evMeta = (e: CEvent) => [e.year || '', e.category].filter(Boolean).join(' · ');

function EventCard({ e }: { e: CEvent }) {
  return (
    <a className="c-card" href={`/events/${e.slug}/`}>
      {e.cover ? <CImg img={e.cover} sizes="(min-width: 960px) 30vw, (min-width: 560px) 46vw, 92vw" alt="" /> : <TypeCard name={e.title} facts={evMeta(e)} />}
      <span className="c-card-title">{e.title}</span>
      <span className="c-card-meta c-mono c-quiet">{evMeta(e)}</span>
    </a>
  );
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCatalogue();
  const p = c.peopleBySlug.get(slug);
  if (!p) notFound();
  const studios = await getAllStudios();
  const studio = studios.find(s => s.hostSlug === slug);
  const url = `https://motplusplusplus.com/profiles/${slug}/`;

  // ── Lêna Bùi: the profile stays, noting only that she asked to be unincluded (S7) ──
  if (p.isLena) {
    return (
      <>
        <WarmPage />
        <div className="c-wrap">
          <div className="c-prof">
            <div className="c-prof-portrait c-prof-type"><TypeCard name={p.name} big /></div>
            <div>
              <h1 className="c-prof-name">{p.name}</h1>
              <Prose paras={toParas(p.bio)} />
            </div>
          </div>
          <Correction pageTitle={p.name} />
        </div>
      </>
    );
  }

  const bioEvent = c.eventsBySlug.get(BIO_EVENT_SLUG[slug] ?? slug);
  const residency = bioEvent?.isBioPage && !NON_RESIDENCY_BIO_SLUGS.has(slug) ? bioEvent.displayDate : '';
  const events = p.eventSlugs.map(s => c.eventsBySlug.get(s)!).filter(Boolean);
  const works = (c.worksByPerson.get(slug) ?? []).filter(w => !!w.slug);
  const available = works.filter(w => isAvailable(w) && w.images.length > 0);
  const others = works.filter(w => !isAvailable(w));
  const tile = c.tiles.get(slug) ?? null;
  const paras = toParas(p.bio);

  // photos for the viewer: portrait first, then their own images, then the bio event's documentation
  const photos: Img[] = [];
  const seen = new Set<string>();
  for (const i of [...(p.portrait ? [p.portrait] : []), ...p.photos, ...(bioEvent?.isBioPage ? bioEvent.images.filter(i => !i.poster) : [])]) {
    if (!seen.has(i.url)) { seen.add(i.url); photos.push(i); }
  }
  const lead = p.portrait ?? tile?.img ?? null;
  const viewer = lead && !photos.some(i => i.url === lead.url) ? [lead, ...photos] : photos;
  // the strip: every photo except the one already shown large at the top (kept in viewer order)
  const ownPhotos = viewer.slice(viewer[0]?.url === lead?.url ? 1 : 0);

  // media: videos from their events and their own links
  const media: (Img & { video: string })[] = [];
  const seenV = new Set<string>();
  for (const e of events) for (const v of e.videos) if (!seenV.has(v)) { seenV.add(v); media.push({ url: '', video: v, caption: e.title }); }
  for (const l of p.links) if (/youtu\.?be|vimeo\.com/.test(l.url) && !seenV.has(l.url)) { seenV.add(l.url); media.push({ url: '', video: l.url, caption: l.label || p.name }); }
  const recordings = events.filter(e => e.bandcampAlbumId);

  // links: never contact details; instagram handles from the field and the list
  const igHandles = new Set<string>();
  for (const h of (p.instagram ?? '').split(/[\s,]+/)) { const x = h.replace(/^@|https?:\/\/(www\.)?instagram\.com\//g, '').replace(/\/.*$/, ''); if (x) igHandles.add(x); }
  const links = p.links.filter(l => !CONTACT.test(l.url) && !/instagram\.com\//i.test(l.url) && !/youtu\.?be|vimeo\.com/.test(l.url));
  for (const l of p.links) { const m = l.url.match(/instagram\.com\/([A-Za-z0-9_.]+)/i); if (m) igHandles.add(m[1]); }

  // facts (P6): only what we hold
  const facts: React.ReactNode[] = [];
  if (p.sinceYear || events.length) facts.push(<>{p.sinceYear ? <>with MoT+++ since <b>{p.sinceYear}</b></> : 'with MoT+++'}{events.length ? <> · <b>{events.length}</b> event{events.length === 1 ? '' : 's'}</> : null}</>);
  if (residency) facts.push(<>residency · <b>{residencyLabel(slug, residency)}</b></>);
  if (bioEvent?.isBioPage && bioEvent.partners.length) facts.push(<>partners · {bioEvent.partners.map((x, i) => <span key={x.name}>{i ? ', ' : ''}{x.url ? <a href={x.url} target="_blank" rel="noopener noreferrer">{x.name}</a> : x.name}</span>)}</>);
  if (p.labels.length) facts.push(<>{p.labels.join(' · ')}</>);
  if (p.programs.length) facts.push(<>{p.programs.join(' · ')}</>);
  if (p.originCity || p.nationalities.length) facts.push(<>{[p.originCity ? `from ${p.originCity}` : '', p.nationalities.map(countryName).join(' · ').toLowerCase()].filter(Boolean).join(' · ')}</>);
  if (p.basedIn) facts.push(<>based in {[p.basedIn.city, p.basedIn.country ? countryName(p.basedIn.country) : null].filter(Boolean).join(', ')}</>);
  if (p.deathYear) facts.push(<>{p.birthYear ? `${p.birthYear}–${p.deathYear}` : `d. ${p.deathYear}`}</>);
  if (p.pronouns) facts.push(<>{p.pronouns}</>);
  const MEMBER: Record<string, string> = { founder: 'founding member', member: 'member', former: 'former member', associated: 'associated with' };
  const memberLine = (role?: string | null, since?: string | null) => [role ? MEMBER[role] ?? role : 'member', since ? `since ${since}` : ''].filter(Boolean).join(', ');
  for (const col of p.collectives) facts.push(<>{memberLine(col.role, col.since)} of <a href={`/profiles/${col.slug}/`}>{col.name}</a></>);
  if (p.roster.length) facts.push(<>members: {p.roster.map((m, i) => <span key={m._id}>{i ? ', ' : ''}<a href={`/profiles/${m.slug}/`}>{m.name}</a> ({memberLine(m.role, m.since)})</span>)}</>);
  // labels the old profile carried that live outside the data (lib/badges.ts)
  if (FOUNDER_SLUGS.has(slug)) facts.unshift(<>founder / director</>);
  if (slug === 'cam-xanh') facts.push(<>+1 direct experience</>);
  if (studio) facts.push(<>hosting artist · <a href={`/afarm/studios/${studio.slug}/`}>view studio</a></>);

  // related (P8): shared disciplines → shared roles and programs; favour available works
  const related = c.people
    .filter(o => o.slug !== slug && !o.isLena)
    .map(o => {
      const d = o.disciplines.filter(x => p.disciplines.includes(x)).length * 3;
      const r = o.roles.filter(x => p.roles.includes(x) && x !== 'artist').length + o.programs.filter(x => p.programs.includes(x)).length;
      const coEvent = o.eventSlugs.some(s => p.eventSlugs.includes(s)) ? 1 : 0;
      const avail = (c.worksByPerson.get(o.slug) ?? []).some(w => isAvailable(w)) ? 1.5 : 0;
      const img = c.tiles.get(o.slug) ? 1 : 0;
      return { o, s: d + r + coEvent + avail + img };
    })
    .filter(x => x.s >= 2)
    .sort((a, b) => b.s - a.s || a.o.sortKey.localeCompare(b.o.sortKey))
    .slice(0, 8);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    ...(p.aliases.length ? { alternateName: p.aliases } : {}),
    url,
    ...(lead ? { image: imgSrc(lead, 1200) } : {}),
    ...(paras.length ? { description: plainOf(paras).slice(0, 500) } : {}),
    ...(p.nationalities.length ? { nationality: p.nationalities.map(n => ({ '@type': 'Country', name: countryName(n) })) } : {}),
    ...(p.disciplines.length ? { knowsAbout: p.disciplines.map(d => DISCIPLINE_LABELS[d]) } : {}),
    ...(p.birthYear ? { birthDate: String(p.birthYear) } : {}),
    ...(p.deathYear ? { deathDate: String(p.deathYear) } : {}),
    ...(links.length || igHandles.size ? { sameAs: [...links.map(l => l.url), ...[...igHandles].map(h => `https://www.instagram.com/${h}`)] } : {}),
    affiliation: { '@type': 'Organization', name: 'MoT+++', url: 'https://motplusplusplus.com' },
    ...(works.length ? {
      workExample: works.slice(0, 20).map((w: Work) => ({
        '@type': 'VisualArtwork', name: w.title, url: `https://motplusplusplus.com/trash/${w.slug}/`,
        ...(w.year ? { dateCreated: String(w.year) } : {}), ...(w.medium ? { artMedium: w.medium } : {}),
        ...(w.images[0] ? { image: w.images[0].url.startsWith('https://cdn.sanity.io/') ? ogImageUrl(w.images[0].url) : w.images[0].url } : {}),
      })),
    } : {}),
  };

  const recent = events.slice(0, 3);
  // aliases that differ only by diacritics or word order read as one name: show the first of each
  const seenA = new Set<string>([fold(p.name).split(/\s+/).sort().join(' ')]);
  const shownAliases = p.aliases.filter(a => { const k = fold(a).split(/\s+/).sort().join(' '); if (seenA.has(k)) return false; seenA.add(k); return true; }).slice(0, 2);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <WarmPage />
      <Visited item={{ id: `a:${slug}`, href: `/profiles/${slug}/`, title: p.name, thumb: tile ? imgSrc(tile.img, 96) : null }} />
      <div className="c-wrap">
        <div className="c-prof">
          <div>
            {lead
              ? <PortraitButton photos={viewer} name={p.name}><CImg img={lead} sizes="(min-width: 900px) 40vw, 92vw" alt={`${p.name}${tile?.from === 'portrait' ? '' : ', image from their work at MoT+++'}`} priority minFill={300} /></PortraitButton>
              : <div className="c-prof-portrait c-prof-type"><TypeCard name={p.name} facts={[p.labels[0], p.sinceYear ? `since ${p.sinceYear}` : ''].filter(Boolean).join(' · ')} big /></div>}
            {lead?.credit && <p className="c-mono c-quiet" style={{ marginTop: 6 }}>photo: {lead.credit}</p>}
          </div>
          <div>
            <h1 className="c-prof-name">{p.name}</h1>
            {shownAliases.length > 0 && <p className="c-prof-alias c-mono c-quiet">also {shownAliases.join(' · ')}</p>}
            <div className="c-prof-actions">
              <HeartButton id={`a:${slug}`} label={p.name} />
            </div>
            {paras.length > 0 && <div style={{ marginTop: 14 }}><Prose paras={paras} limit={120} /></div>}
            {facts.length > 0 && <ul className="c-facts" aria-label="facts">{facts.map((f, i) => <li key={i}>{f}</li>)}</ul>}
          </div>
        </div>

        {available.length > 0 && <div className="c-sec"><ProfileWorks title="+1 trash · available" works={available} /><div style={{ marginTop: 6 }}><NotifyMe artist={p.name} /></div></div>}
        {available.length === 0 && others.length > 0 && <div className="c-sec"><NotifyMe artist={p.name} /></div>}
        {others.length > 0 && <div className="c-sec"><ProfileWorks title="works" works={others} /></div>}

        {ownPhotos.length > 0 && (
          <section className="c-sec" aria-labelledby="pp-h">
            <div className="c-sec-h"><h2 id="pp-h">photos · {ownPhotos.length}</h2></div>
            <GalleryGrid items={ownPhotos} all={viewer} offset={viewer.length - ownPhotos.length} title={`${p.name}: photos`} className="c-strip" autoOpen={false} captions />
          </section>
        )}

        {(media.length > 0 || recordings.length > 0) && (
          <section className="c-sec" aria-labelledby="pm-h">
            <div className="c-sec-h"><h2 id="pm-h">media</h2></div>
            {media.length > 0 && <GalleryGrid items={media} title={`${p.name}: media`} className="c-strip" autoOpen={false} />}
            {recordings.length > 0 && <ul className="c-links" style={{ marginTop: 8 }}>{recordings.map(e => <li key={e.slug}><a className="mot-link c-mono" href={`/events/${e.slug}/`}>listen: {e.title}</a></li>)}</ul>}
          </section>
        )}

        {events.length > 0 && (
          <section className="c-sec" aria-labelledby="pe-h">
            <div className="c-sec-h"><h2 id="pe-h">events · {events.length}</h2></div>
            <div className="c-cards">{recent.map(e => <EventCard key={e.slug} e={e} />)}</div>
            {events.length > 3 && (
              <div style={{ marginTop: 22 }}>
                <Timeline rows={events.slice(3).map(e => ({
                  slug: e.slug, year: e.year, title: e.title,
                  role: creditLabel(e.credits.find(cr => cr.person._id === p._id)?.role, p.labels),
                  thumb: e.cover ? { url: e.cover.url, w: e.cover.w, h: e.cover.h, fx: e.cover.fx, fy: e.cover.fy } : null,
                }))} />
              </div>
            )}
          </section>
        )}

        {(links.length > 0 || igHandles.size > 0) && (
          <section className="c-sec" aria-labelledby="pl-h">
            <div className="c-sec-h"><h2 id="pl-h">links</h2></div>
            <ul className="c-links">
              {links.map(l => {
                const domain = l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                const generic = !l.label || /^(website|web|site|link|homepage|portfolio)$/i.test(l.label.trim());
                return <li key={l.url}><a className="mot-link c-mono" href={l.url} target="_blank" rel="noopener noreferrer">{generic ? domain : `${l.label.toLowerCase()} · ${domain.split('/')[0]}`}</a></li>;
              })}
              {[...igHandles].map(h => <li key={h}><a className="mot-link c-mono" href={`https://www.instagram.com/${h}/`} target="_blank" rel="noopener noreferrer">instagram @{h}</a></li>)}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="c-sec" aria-labelledby="pr-h">
            <div className="c-sec-h"><h2 id="pr-h">related</h2></div>
            <div className="c-row">
              {related.map(({ o }) => {
                const t = c.tiles.get(o.slug);
                return (
                  <a key={o.slug} className="c-tile" href={`/profiles/${o.slug}/`}>
                    {t ? <CImg img={t.img} sizes="(min-width: 760px) 18vw, 42vw" alt="" /> : <TypeCard name={o.name} facts={o.labels[0] ?? ''} />}
                    <span className="c-tile-name">{o.name}</span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <Correction pageTitle={p.name} />
      </div>
    </>
  );
}
