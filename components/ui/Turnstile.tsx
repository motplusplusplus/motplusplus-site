'use client';
/** Cloudflare Turnstile, invisible for most visitors (no puzzles). Renders
 *  nothing while TURNSTILE_SITE_KEY is empty (lib/turnstile.ts). */
import { useEffect, useRef } from 'react';
import { TURNSTILE_SITE_KEY } from '@/lib/turnstile';

type TS = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void };
let loading: Promise<void> | null = null;
function load(): Promise<void> {
  loading ??= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true; s.onload = () => res(); s.onerror = () => rej();
    document.head.appendChild(s);
  });
  return loading;
}
export default function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !el.current) return;
    let id: string | null = null;
    load().then(() => {
      const ts = (window as unknown as { turnstile?: TS }).turnstile;
      if (ts && el.current) id = ts.render(el.current, { sitekey: TURNSTILE_SITE_KEY, appearance: 'interaction-only', callback: onToken });
    }).catch(() => {});
    return () => { const ts = (window as unknown as { turnstile?: TS }).turnstile; if (id && ts) ts.remove(id); };
  }, [onToken]);
  return TURNSTILE_SITE_KEY ? <div ref={el} /> : null;
}
