'use client';
/** D4: "tell me when new works by this artist arrive". Signs the address up to the
 *  existing newsletter (worker/subscribe.js → the subscribers Google Sheet), tagged
 *  with the artist's name. Never stored in Sanity. Excluded (do-not-contact) and
 *  bounced addresses are left untouched by the worker. */
import { useRef, useState } from 'react';
import { track } from '@/lib/track';

export default function NotifyMe({ artist }: { artist: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [err, setErr] = useState('');
  const t0 = useRef(0);
  if (!open) return (
    <button type="button" className="mot-link c-mono" style={{ minHeight: 44 }} onClick={() => { t0.current = Date.now(); setOpen(true); }}>
      tell me when new works by this artist arrive
    </button>
  );
  if (state === 'done') return <p className="c-mono c-quiet" role="status">thank you. we&rsquo;ll write when new works arrive.</p>;
  return (
    <form className="c-form" style={{ maxWidth: 420 }} onSubmit={async e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      setState('sending'); setErr('');
      try {
        const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fd.get('email'), website: fd.get('website'), artist, elapsedMs: Date.now() - t0.current }) });
        const d = await res.json().catch(() => ({}));
        if (!res.ok || !d.ok) throw new Error(d.error || 'something went wrong. please try again.');
        setState('done'); track('notify-me');
      } catch (x) { setState('idle'); setErr((x as Error).message); }
    }}>
      <label>email for new works by {artist}<input name="email" type="email" required autoComplete="email" autoFocus /></label>
      <div className="c-hp" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      {err && <p className="c-mono c-err" role="alert">{err}</p>}
      <button type="submit" className="mot-btn mot-btn-solid" disabled={state === 'sending'}>{state === 'sending' ? 'sending…' : 'notify me'}</button>
      <p className="c-mono c-quiet" style={{ margin: 0 }}>you join the MoT+++ newsletter; unsubscribe any time.</p>
    </form>
  );
}
