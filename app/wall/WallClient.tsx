'use client';
/** D3 /wall: everything saved (localStorage), a masonry grid in the same viewer.
 *  "share my wall" encodes the ids in the URL (no account, nothing on a server).
 *  With available works saved, "inquire about these works" opens one email. */
import { useEffect, useMemo, useState } from 'react';
import { loadItems, type Item } from '@/lib/items';
import { idsFromShare, readWall, toggleWall, wallShareUrl, type WallId } from '@/lib/wall';
import { useStored } from '@/lib/useStore';
import { openGallery } from '@/components/media/gallery';
import { CONTACTS } from '@/lib/contacts';
import { track } from '@/lib/track';
import { TypeCard } from '@/components/cat/Pieces';

const big = (u: string) => u.replace(/\?w=\d+/, '?w=2400');

export default function WallClient() {
  const shareParam = useStored(() => new URLSearchParams(location.search).get('s'), 'popstate', null);
  const shared = idsFromShare(shareParam).length > 0;
  const mine = useStored(readWall, 'mot:wall-change', [] as WallId[]);
  const ids: WallId[] = shared ? idsFromShare(shareParam) : mine;
  const [items, setItems] = useState<Item[] | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { loadItems().then(setItems); }, []);
  const byId = useMemo(() => new Map((items ?? []).map(i => [i.id, i])), [items]);
  const list = ids.map(id => byId.get(id)).filter(Boolean) as Item[];
  const available = list.filter(i => i.id.startsWith('w:') && i.avail);
  const withImg = list.filter(i => i.thumb);

  const share = async () => {
    const url = wallShareUrl(ids);
    track('wall-share');
    if (window.matchMedia('(pointer: coarse)').matches && navigator.share) { try { await navigator.share({ title: 'my MoT+++ wall', url }); } catch { /* dismissed */ } return; }
    try { await navigator.clipboard.writeText(url); setMsg('link copied'); } catch { setMsg(url); }
    setTimeout(() => setMsg(''), 2500);
  };
  const inquire = () => {
    track('inquire');
    const body = ['Hello,', '', 'I would like to ask about these works:', '', ...available.map(i => `- ${i.title}, ${i.sub}\n  https://motplusplusplus.com${i.href}`), '', 'Thank you.'].join('\n');
    window.location.assign(`mailto:${CONTACTS.sales}?subject=${encodeURIComponent(`inquiry: ${available.length} works from my wall`)}&body=${encodeURIComponent(body)}`);
  };
  const keepShared = () => { for (const id of ids) if (!readWall().includes(id)) toggleWall(id); window.location.assign('/wall/'); };

  return (
    <div className="c-wrap">
      <div className="c-topbar">
      <h1 className="c-h1">{shared ? 'a shared wall' : 'my wall'}</h1>
      <div className="c-controls">
        <span className="c-mono c-quiet c-count">{list.length} saved</span>
        {!shared && list.length > 0 && <button type="button" className="mot-pill" onClick={share}>share my wall</button>}
        {shared && list.length > 0 && <button type="button" className="mot-pill" onClick={keepShared}>save these to my wall</button>}
        {available.length > 0 && <button type="button" className="mot-btn mot-btn-solid" onClick={inquire} style={{ minHeight: 44 }}>inquire about these works</button>}
      </div>
      </div>
      {msg && <p className="c-mono c-quiet" role="status">{msg}</p>}
      {items && list.length === 0 && (
        <p className="c-mono c-quiet" style={{ marginTop: 24, lineHeight: 1.7 }}>
          nothing here yet. the thin heart on a work, an artist or an event saves it here, in this browser only.
        </p>
      )}
      <div className="c-wall" style={{ marginTop: 18 }}>
        {list.map(i => (
          <div key={i.id} className="c-wall-item">
            {i.thumb ? (
              <button type="button" style={{ border: 0, padding: 0, background: 'none', width: '100%', cursor: 'zoom-in', display: 'block' }}
                aria-label={`view ${i.title}`}
                onClick={() => openGallery({ items: withImg.map(x => ({ url: big(x.thumb!), w: x.w || undefined, h: x.h || undefined, caption: `${x.title} · ${x.sub}` })), index: withImg.indexOf(i), title: 'my wall' })}>
                <span className="c-img" style={{ aspectRatio: i.w && i.h ? `${i.w} / ${i.h}` : '4 / 5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.thumb} alt="" loading="lazy" />
                </span>
              </button>
            ) : <TypeCard name={i.title} facts={i.sub} />}
            <a href={i.href} style={{ display: 'block', marginTop: 6, color: 'var(--mot-ink)', fontSize: 14, textDecoration: 'none' }}>{i.title}</a>
            <span className="c-mono c-quiet">{i.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
