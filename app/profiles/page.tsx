/** /profiles, the MoTcyclopedia (2026-11-22 redesign).
 *
 *  Everything a visitor first sees is server-rendered HTML; the only client code is
 *  a small controller (ProfilesControls) for browse, search, "show more" and the
 *  A–Z hover tile. That keeps a mid-range phone's main thread free (no hydrating
 *  hundreds of tiles and names).
 *
 *  Featured (P1): the 72 strongest by weight are rendered; an inline script right
 *  after the grid applies this visitor's seeded, weighted-random order and shows
 *  the first 24, before first paint, frozen for the session. */

import type { Metadata } from 'next';
import { getProfileEntries, type Entry } from '@/lib/profileEntries';
import { countryName } from '@/lib/countries';
import { DISCIPLINE_LABELS, DISCIPLINE_ORDER } from '@/lib/disciplines';
import { imgSrc } from '@/components/cat/Pieces';
import PersonTile from '@/components/cat/PersonTile';
import WarmPage from '@/components/work/WarmPage';
import ProfilesControls, { type Opts } from './ProfilesControls';

export const metadata: Metadata = {
  title: 'MoTcyclopedia',
  description: 'Every artist, curator, writer and collaborator who has worked with MoT+++ in Ho Chi Minh City: a.Farm residents, MoTsound performers, +1 trash artists and more.',
  alternates: { canonical: 'https://motplusplusplus.com/profiles' },
};

const POOL = 72;
const SHOW = 24;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROLES = ['artist', 'curator', 'performer', 'writer', 'moderator', 'researcher', 'critic'];
const PROGRAMS = ['a.Farm', 'MoTsound', 'performance plus', '+1 museum', '+1 trash'];

// seeded (mulberry32) weighted-random order, applied before paint; stable per session
const ORDER_SCRIPT = `(function(){try{var g=document.getElementById('pf-featured');if(!g)return;var k='mot:profiles:seed',s=0;try{s=+sessionStorage.getItem(k)}catch(e){}if(!(s>0)){s=Math.floor(Math.random()*4294967295)+1;try{sessionStorage.setItem(k,String(s))}catch(e){}}var a=s|0;function r(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}var kids=[].slice.call(g.children),sc=kids.map(function(el){return{el:el,v:+el.getAttribute('data-w')+3*r()}});sc.sort(function(x,y){return y.v-x.v});sc.forEach(function(x,i){x.el.style.order=i;x.el.setAttribute('data-i',i);if(i>=${SHOW})x.el.hidden=true;else x.el.hidden=false});}catch(e){}})();`;

function count(entries: Entry[], pick: (e: Entry) => string[] | string | null) {
  const m = new Map<string, number>();
  for (const e of entries) { const v = pick(e); for (const x of Array.isArray(v) ? v : v ? [v] : []) m.set(x, (m.get(x) ?? 0) + 1); }
  return m;
}

export default async function ProfilesPage() {
  const entries = await getProfileEntries();
  const pool = [...entries].sort((a, b) => b.w - a.w || a.name.localeCompare(b.name)).slice(0, POOL);

  const roles = count(entries, e => e.roles), programs = count(entries, e => e.programs), countries = count(entries, e => e.countries), disc = count(entries, e => e.disciplines), based = count(entries, e => e.based);
  const opts: Opts = {
    role: ROLES.filter(r => roles.get(r)).map(r => ({ v: r, label: r, n: roles.get(r)! })),
    program: PROGRAMS.filter(p => programs.get(p)).map(p => ({ v: p, label: p, n: programs.get(p)! })),
    discipline: DISCIPLINE_ORDER.filter(d => disc.get(d)).map(d => ({ v: d, label: DISCIPLINE_LABELS[d], n: disc.get(d)! })),
    country: [...countries].sort((a, b) => b[1] - a[1] || countryName(a[0]).localeCompare(countryName(b[0]))).map(([v, n]) => ({ v, label: countryName(v).toLowerCase(), n })),
    // N2: "based in" appears only once 30% or more of people have it
    based: entries.filter(e => e.based).length / Math.max(1, entries.length) >= 0.3
      ? [...based].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, label: countryName(v).toLowerCase(), n })) : [],
  };

  const groups = new Map<string, Entry[]>();
  for (const e of entries) { const arr = groups.get(e.letter) ?? []; arr.push(e); groups.set(e.letter, arr); }

  return (
    <>
      <WarmPage />
      <div className="c-wrap">
        <div className="c-topbar">
          <h1 className="c-h1">MoTcyclopedia</h1>
          <ProfilesControls opts={opts} total={entries.length} />
        </div>

        <div id="pf-main">
          <section className="c-sec" aria-label="featured" style={{ marginTop: 14 }}>
            <div className="c-tiles c-bw" id="pf-featured">
              {pool.map((e, i) => (
                <div key={e.slug} data-w={e.w} hidden={i >= SHOW} style={{ minWidth: 0 }} suppressHydrationWarning>
                  <PersonTile e={e} priority={i < 4} />
                </div>
              ))}
            </div>
            <script dangerouslySetInnerHTML={{ __html: ORDER_SCRIPT }} />
            <div className="c-more" id="pf-more-wrap">
              <button type="button" className="mot-pill" id="pf-more">show more</button>
            </div>
          </section>

          <section className="c-sec" aria-labelledby="az-h" style={{ marginTop: 56 }}>
            <div className="c-sec-h"><h2 id="az-h">a–z · {entries.length}</h2></div>
            <nav className="c-az-strip" aria-label="jump to letter">
              {LETTERS.map(l => groups.has(l) ? <a key={l} href={`#az-${l}`}>{l}</a> : <span key={l} aria-hidden="true">{l}</span>)}
            </nav>
            <div className="c-az" id="pf-az">
              {[...groups].map(([l, es]) => (
                <div key={l} id={`az-${l}`} className="c-az-group">
                  <h3 className="c-az-letter">{l}</h3>
                  <ul className="c-az-list">
                    {es.map(e => (
                      <li key={e.slug}>
                        <a href={`/profiles/${e.slug}/`} data-t={e.tile ? imgSrc(e.tile, 340) : ''} data-p={e.tile && e.tile.fx != null ? `${Math.round(e.tile.fx * 100)}% ${Math.round((e.tile.fy ?? 0.4) * 100)}%` : ''} data-f={e.facts}>
                          <span className="c-az-name">{e.name}</span>
                          {e.n > 0 && <span className="c-az-n">· {e.n}</span>}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
