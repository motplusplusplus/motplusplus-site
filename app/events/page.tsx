/** /events (2026-11-22 redesign). Server-rendered; EventsControls is the only
 *  client code (view toggle, search, year strip, now & next upkeep, on this day,
 *  list hover covers). Each archive item carries both presentations: CSS shows it
 *  as a card (grid) or one dense line (list), so switching costs no re-render.
 *  The view is chosen before first paint: grid on desktop, list on phones, a
 *  visitor's choice for the session wins. */

import type { Metadata } from 'next';
import { getCatalogue } from '@/lib/catalogue';
import { toEntry, type EventEntry } from '@/lib/eventEntry';
import { CImg, TypeCard, imgSrc } from '@/components/cat/Pieces';
import WarmPage from '@/components/work/WarmPage';
import EventsControls from './EventsControls';
import AddToCalendar from './AddToCalendar';

export const metadata: Metadata = {
  title: 'events',
  description: 'Every MoT+++ exhibition, performance, MoTsound night, a.Farm open studio and talk since 2015, in Ho Chi Minh City and beyond: what is on now and next, and the full archive by year.',
  alternates: { canonical: 'https://motplusplusplus.com/events' },
};

function isoDaysAgo(days: number): string { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); }

const VIEW_SCRIPT = `(function(){try{var v=null;try{v=sessionStorage.getItem('mot:events:view')}catch(e){}if(v!=='grid'&&v!=='list')v=window.matchMedia('(min-width: 760px)').matches?'grid':'list';var a=document.getElementById('ev-archive');if(a){a.classList.remove('is-grid','is-list');a.classList.add('is-'+v)}}catch(e){}})();`;

function Item({ e, priority }: { e: EventEntry; priority?: boolean }) {
  return (
    <li className="c-ev" data-slug={e.slug} data-cover={e.cover ? imgSrc(e.cover, 440) : ''}>
      <a href={`/events/${e.slug}/`}>
        <span className="c-ev-media">
          {e.cover ? <CImg img={e.cover} sizes="(min-width: 960px) 30vw, (min-width: 560px) 46vw, 92vw" alt="" priority={priority} />
            : <TypeCard name={e.title} facts={[e.year, e.category].filter(Boolean).join(' · ')} />}
        </span>
        <span className="c-ev-date">{e.start}</span>
        <span className="c-ev-title">{e.title}</span>
        <span className="c-ev-meta">{[e.displayDate || e.start, e.category].filter(Boolean).join(' · ')}</span>
        <span className="c-ev-cat">{e.category}</span>
        <span className="c-ev-venue">{e.venue}</span>
      </a>
    </li>
  );
}

export default async function EventsPage() {
  const c = await getCatalogue();
  const events = c.listed.map(toEntry);
  const built = new Date().toISOString().slice(0, 10);
  // recent and upcoming events are rendered; the browser shows the ones still on today
  // (so the band stays right between builds). Hidden when nothing is on.
  const since = isoDaysAgo(150);
  const upcoming = events.filter(e => (e.end ?? e.start) >= since).sort((a, b) => a.start.localeCompare(b.start));
  const anyNow = upcoming.some(e => (e.end ?? e.start) >= built);

  const byYear = new Map<number, EventEntry[]>();
  for (const e of events) { const arr = byYear.get(e.year) ?? []; arr.push(e); byYear.set(e.year, arr); }
  const years = [...byYear].sort((a, b) => b[0] - a[0]);
  const ys = years.map(y => y[0]).filter(Boolean);
  const strip: [number, number][] = [];
  for (let y = Math.max(...ys); y >= Math.min(...ys); y--) strip.push([y, byYear.get(y)?.length ?? 0]);
  const maxN = Math.max(1, ...strip.map(s => s[1]));
  // on this day: computed in the browser (today's date), from this small list
  const mini = events.map(e => [e.slug, e.title, e.start, e.cover ? imgSrc(e.cover, 300) : '']);

  return (
    <>
      <WarmPage />
      <div className="c-wrap">
        <div className="c-topbar">
          <h1 className="c-h1">events</h1>
          <EventsControls total={events.length} />
        </div>

        {upcoming.length > 0 && (
          <section className="c-sec" aria-labelledby="now-h" id="ev-now" style={{ marginTop: 16 }} hidden={!anyNow} suppressHydrationWarning>
            <div className="c-sec-h"><h2 id="now-h">now &amp; next</h2></div>
            <div className="c-now">
              {upcoming.map((e, i) => (
                <div key={e.slug} className="c-now-card" data-end={e.end ?? e.start} hidden={(e.end ?? e.start) < built} suppressHydrationWarning>
                  <a className="c-card" href={`/events/${e.slug}/`}>
                    {e.cover ? <CImg img={e.cover} sizes="(min-width: 900px) 46vw, 92vw" alt="" priority={i < 2} /> : <TypeCard name={e.title} facts={e.category} big />}
                    <span className="c-card-title">{e.title}</span>
                    <span className="c-card-meta c-mono c-quiet">{[e.displayDate || e.start, e.venue].filter(Boolean).join(' · ')}</span>
                  </a>
                  {e.line && <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: '#44403a' }}>{e.line}</p>}
                  <AddToCalendar e={{ slug: e.slug, title: e.title, start: e.start, end: e.end, location: [e.venue, e.venueAddress].filter(Boolean).join(', '), description: e.line }} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="c-sec" aria-labelledby="otd-h" id="ev-otd" hidden>
          <div className="c-sec-h"><h2 id="otd-h">on this day in MoT+++</h2></div>
          <div className="c-otd" id="ev-otd-list" />
        </section>
        <script type="application/json" id="ev-mini" dangerouslySetInnerHTML={{ __html: JSON.stringify(mini).replace(/</g, '\\u003c') }} />

        <section className="c-sec" aria-label="archive" style={{ marginTop: 34 }}>
          <nav className="c-years" id="ev-years" aria-label="jump to year">
            {strip.map(([y, n]) => (
              <a key={y} href={byYear.has(y) ? `#y-${y}` : undefined} className="c-year" data-jump={y} aria-disabled={!byYear.has(y) || undefined} style={byYear.has(y) ? undefined : { opacity: 0.35 }}>
                <span className="c-year-bar" style={{ height: 4 + Math.round((n / maxN) * 26) }} aria-hidden="true" />
                <span>{String(y).slice(2)}</span>
                <span className="c-sr">{y}, {n} event{n === 1 ? '' : 's'}</span>
              </a>
            ))}
          </nav>
          <p className="c-mono c-quiet" id="ev-empty" hidden style={{ marginTop: 20 }}>nothing matches.</p>
          <div id="ev-archive" className="c-arch is-grid" suppressHydrationWarning>
            {years.map(([y, es], gi) => (
              <div key={y} id={`y-${y}`} data-year={y} className="c-year-group">
                <h2 className="c-year-h">{y} · <span data-count>{es.length}</span></h2>
                <ul className="c-ev-list">{es.map((e, i) => <Item key={e.slug} e={e} priority={!upcoming.length && gi === 0 && i < 3} />)}</ul>
              </div>
            ))}
          </div>
          <script dangerouslySetInnerHTML={{ __html: VIEW_SCRIPT }} />
        </section>
      </div>
    </>
  );
}
