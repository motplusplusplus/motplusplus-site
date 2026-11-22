'use client';

/** The MoTcyclopedia's only client code: browse (pill → bottom sheet / panel),
 *  search (names, aliases, Vietnamese names; diacritics folded, highlights on the
 *  original), "show more" for the featured grid, and the A–Z hover tile. The
 *  person list is fetched (/profiles/index.json) only when someone filters. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sheet from '@/components/ui/Sheet';
import PersonTile from '@/components/cat/PersonTile';
import { matchesAll, queryTerms } from '@/lib/fold';
import { THIN } from '@/components/cat/Pieces';
import type { Entry } from '@/lib/profileEntries';

type Opt = { v: string; label: string; n: number };
export type Opts = { role: Opt[]; program: Opt[]; discipline: Opt[]; country: Opt[]; based: Opt[] };
type Filters = { role: string | null; program: string | null; country: string | null; discipline: string | null; based: string | null };
const NONE: Filters = { role: null, program: null, country: null, discipline: null, based: null };
const BATCH = 24;
const LABEL: Record<keyof Filters, string> = { role: 'role', program: 'program', discipline: 'discipline', country: 'country', based: 'based in' };

let entriesP: Promise<Entry[]> | null = null;
const loadEntries = () => (entriesP ??= fetch('/profiles/index.json').then(r => r.json()).catch(() => { entriesP = null; return []; }));

function useFeaturedMore() {
  useEffect(() => {
    const btn = document.getElementById('pf-more');
    const wrap = document.getElementById('pf-more-wrap');
    const grid = document.getElementById('pf-featured');
    if (!btn || !wrap || !grid) return;
    const kids = () => Array.from(grid.children) as HTMLElement[];
    const update = () => {
      const all = kids(); const shown = all.filter(k => !k.hidden).length;
      btn.textContent = `show more · ${shown} of ${all.length}`;
      wrap.hidden = shown >= all.length;
    };
    const more = () => {
      const all = kids().sort((a, b) => +(a.dataset.i ?? 0) - +(b.dataset.i ?? 0));
      let n = 0;
      for (const k of all) if (k.hidden && n < BATCH) { k.hidden = false; n++; }
      update();
    };
    update();
    btn.addEventListener('click', more);
    return () => btn.removeEventListener('click', more);
  }, []);
}

/** Desktop: hovering an A–Z name shows its tile beside the cursor. Phones: a tap just goes. */
function useAzHover() {
  useEffect(() => {
    const az = document.getElementById('pf-az');
    if (!az || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const box = document.createElement('div');
    box.className = 'c-hover-tile';
    box.setAttribute('aria-hidden', 'true');
    document.body.appendChild(box);
    let cur: HTMLAnchorElement | null = null;
    const move = (e: PointerEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-t]');
      if (!a) { box.classList.remove('is-on'); cur = null; return; }
      if (a !== cur) {
        cur = a;
        const t = a.dataset.t, name = a.querySelector('.c-az-name')?.textContent ?? '';
        box.innerHTML = t
          ? `<span class="c-img"><img src="${t}" alt="" style="object-position:${a.dataset.p || '50% 40%'}"></span>`
          : `<span class="c-type"><span class="c-type-name"></span><span class="c-type-facts"></span></span>`;
        if (!t) { box.querySelector('.c-type-name')!.textContent = name; box.querySelector('.c-type-facts')!.textContent = a.dataset.f ?? ''; }
      }
      box.style.left = `${Math.min(e.clientX + 18, window.innerWidth - 186)}px`;
      box.style.top = `${Math.min(e.clientY + 12, window.innerHeight - 230)}px`;
      box.classList.add('is-on');
    };
    const leave = () => { box.classList.remove('is-on'); cur = null; };
    az.addEventListener('pointermove', move);
    az.addEventListener('pointerleave', leave);
    return () => { az.removeEventListener('pointermove', move); az.removeEventListener('pointerleave', leave); box.remove(); };
  }, []);
}

export default function ProfilesControls({ opts, total }: { opts: Opts; total: number }) {
  const [f, setF] = useState<Filters>(NONE);
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sheet, setSheet] = useState<'sheet' | 'panel' | null>(null);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [shown, setShown] = useState(BATCH);
  const pill = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useFeaturedMore();
  useAzHover();

  const terms = useMemo(() => queryTerms(q), [q]);
  const filtering = terms.length > 0 || Object.values(f).some(Boolean);

  // filters and the query live in the address, so a browse is shareable
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const init = { ...NONE };
    let any = false;
    for (const k of Object.keys(NONE) as (keyof Filters)[]) { const v = p.get(k); if (v) { init[k] = v; any = true; } }
    const qq = p.get('q');
    if (any || qq) queueMicrotask(() => { if (any) setF(init); if (qq) { setQ(qq); setSearchOpen(true); } });
  }, []);
  useEffect(() => {
    if (!filtering) return;
    loadEntries().then(setEntries);
  }, [filtering]);
  // the results replace the featured grid and the A–Z list while filtering
  useEffect(() => {
    const main = document.getElementById('pf-main');
    if (main) main.hidden = filtering;
  }, [filtering]);

  const openSheet = useCallback(() => {
    setSheet(s => (s ? null : window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches ? 'panel' : 'sheet'));
  }, []);
  useEffect(() => {
    const s = () => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 20); };
    window.addEventListener('mot:search', s);
    window.addEventListener('mot:filter', openSheet);
    return () => { window.removeEventListener('mot:search', s); window.removeEventListener('mot:filter', openSheet); };
  }, [openSheet]);

  const syncUrl = (next: Filters, nextQ: string) => {
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(next)) { if (v) url.searchParams.set(k, v); else url.searchParams.delete(k); }
    if (nextQ.trim()) url.searchParams.set('q', nextQ.trim()); else url.searchParams.delete('q');
    history.replaceState(history.state, '', url);
  };
  const setFilter = (k: keyof Filters, v: string | null) => { const next = { ...f, [k]: f[k] === v ? null : v }; setF(next); setShown(BATCH); syncUrl(next, q); };
  const clear = () => { setF(NONE); setShown(BATCH); syncUrl(NONE, q); };
  const setQuery = (v: string) => { setQ(v); setShown(BATCH); syncUrl(f, v); };

  const matches = useMemo(() => (entries ?? []).filter(e =>
    (!f.role || e.roles.includes(f.role)) && (!f.program || e.programs.includes(f.program)) &&
    (!f.country || e.countries.includes(f.country)) && (!f.discipline || e.disciplines.includes(f.discipline)) &&
    (!f.based || e.based === f.based) && (!terms.length || matchesAll(e.q, terms))
  ), [entries, f, terms]);

  const label = (k: keyof Filters, v: string) => [...opts[k]].find(o => o.v === v)?.label ?? v;
  const chips = (Object.entries(f) as [keyof Filters, string | null][]).filter(([, v]) => v);
  const activeCount = chips.length;

  const browse = (mode: 'sheet' | 'panel') => (
    <Sheet id={`pb-${mode}`} mode={mode} open={sheet === mode} onClose={() => setSheet(null)} anchor={pill} title="browse"
      headExtra={<button type="button" className="mot-link mot-mono" onClick={clear}>clear</button>}>
      {(Object.keys(LABEL) as (keyof Filters)[]).map(k => opts[k].length > 0 && (
        <fieldset key={k} className="c-browse-group fs-group">
          <legend className="mot-mono mot-label">{LABEL[k]}</legend>
          <div className="fs-options">
            {opts[k].map((o, i) => (
              <button key={o.v} type="button" className="mot-opt" aria-pressed={f[k] === o.v} onClick={() => setFilter(k, o.v)} data-autofocus={k === 'role' && i === 0 ? '' : undefined}>
                {o.label}<span className="mot-opt-n">{o.n}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="button" className="mot-btn mot-btn-solid fs-done" onClick={() => setSheet(null)}>
        {entries || !filtering ? `show ${filtering ? matches.length : total} people` : 'done'}
      </button>
    </Sheet>
  );

  const results = filtering ? (
    <section className="c-sec" aria-label="results" style={{ marginTop: 14 }}>
      {!entries ? <p className="c-mono c-quiet">loading…</p>
        : matches.length === 0 ? <p className="c-mono c-quiet">nothing matches. <button type="button" className="mot-link" onClick={() => { clear(); setQuery(''); }}>clear</button></p>
        : <div className="c-tiles c-bw">{matches.slice(0, shown).map(e => <PersonTile key={e.slug} e={e} terms={terms} />)}</div>}
      {entries && shown < matches.length && (
        <div className="c-more"><button type="button" className="mot-pill" onClick={() => setShown(s => s + BATCH)}>show more · {shown} of {matches.length}</button></div>
      )}
    </section>
  ) : null;

  return (
    <>
      <div className="c-controls" role="toolbar" aria-label="browse people">
        <div className="tg-filter-anchor">
          <button ref={pill} type="button" className="mot-pill" onClick={openSheet} aria-haspopup="dialog" aria-expanded={!!sheet} data-label="browse by role, program, country">
            browse{activeCount > 0 && <span className="mot-pill-n">{activeCount}</span>}
          </button>
          {browse('panel')}
        </div>
        <span className="c-mono c-quiet c-count" aria-live="polite">{filtering && entries ? `${matches.length} of ${total}` : `${total} people`}</span>
        <button type="button" className="mot-icon-btn" aria-expanded={searchOpen} aria-controls="pf-search"
          aria-label={searchOpen ? 'close search' : 'search names'} data-label={searchOpen ? 'close search' : 'search'}
          onPointerEnter={() => loadEntries()}
          onClick={() => { const n = !searchOpen; setSearchOpen(n); if (n) setTimeout(() => searchRef.current?.focus(), 20); else setQuery(''); }}>{THIN.search}</button>
      </div>
      {searchOpen && (
        <div className="c-search" id="pf-search">
          <input ref={searchRef} type="search" value={q} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); setSearchOpen(false); } }}
            placeholder="name, alias or vietnamese name" aria-label="search names, aliases and vietnamese names" autoComplete="off" enterKeyHint="search" />
        </div>
      )}
      {chips.length > 0 && (
        <ul className="tg-chips" aria-label="active filters">
          {chips.map(([k, v]) => (
            <li key={k} className="mot-chip">
              <span className="mot-mono">{label(k, v!)}</span>
              <button type="button" onClick={() => setFilter(k, null)} aria-label={`remove ${label(k, v!)}`} data-label="remove">
                <svg aria-hidden="true" viewBox="0 0 12 12" width="10" height="10"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      {results}
      {browse('sheet')}
    </>
  );
}
