'use client';
/** D7: the last 6 things viewed this session. Bottom-left on desktop
 *  (collapsible); inside the menu on phones (<PathList/>). */
import { useState } from 'react';
import { readPath, PATH_EVT } from '@/lib/path';
import { useStored } from '@/lib/useStore';

const EMPTY: ReturnType<typeof readPath> = [];
const usePath = () => useStored(readPath, PATH_EVT, EMPTY);
const useHere = () => useStored(() => location.pathname, 'popstate', '');
export function PathList({ skip, light = false }: { skip?: string; light?: boolean }) {
  const items = usePath().filter(i => i.href !== skip);
  if (!items.length) return null;
  return (
    <ol className="c-path-list" aria-label="your path" style={light ? { background: 'transparent', border: 0, padding: 0, width: 'auto' } : undefined}>
      {items.map(i => (
        <li key={i.id}><a href={i.href}>{/* eslint-disable-next-line @next/next/no-img-element */}
          {i.thumb ? <img src={i.thumb} alt="" loading="lazy" /> : <span className="c-path-ph" />}<span>{i.title}</span></a></li>
      ))}
    </ol>
  );
}
export default function YourPath() {
  const [open, setOpen] = useState(false);
  const here = useHere();
  const items = usePath();
  if (items.filter(i => i.href !== here).length < 1) return null;
  return (
    <div className="c-path">
      {open && <PathList skip={here} />}
      <button type="button" className="c-path-toggle" aria-label="your path: the last things you looked at" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        path · {items.filter(i => i.href !== here).length}
      </button>
    </div>
  );
}
