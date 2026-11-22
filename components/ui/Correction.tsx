'use client';
/** C1: "something wrong or missing? suggest a correction". Opens a small form in
 *  place: a bottom sheet on phones, a panel on desktop. Posts to /api/correction
 *  (worker/correction.js), which only emails admin@: nothing is stored, nothing on
 *  the site changes by itself. */
import { useCallback, useRef, useState } from 'react';
import Sheet from './Sheet';
import Turnstile from './Turnstile';
import { track } from '@/lib/track';

export default function Correction({ pageTitle }: { pageTitle: string }) {
  const [mode, setMode] = useState<'sheet' | 'panel' | null>(null);
  const [who, setWho] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [err, setErr] = useState('');
  const t0 = useRef(0);
  const token = useRef('');
  const btn = useRef<HTMLButtonElement>(null);
  const onToken = useCallback((t: string) => { token.current = t; }, []);

  const open = () => {
    t0.current = Date.now(); setErr(''); setState('idle');
    setMode(window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches ? 'panel' : 'sheet');
  };
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!who) { setErr('please say who you are.'); return; }
    if (String(fd.get('change') ?? '').trim().length < 3) { setErr('please say what needs changing.'); return; }
    setState('sending'); setErr('');
    try {
      const res = await fetch('/api/correction', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          who, name: fd.get('name'), email: fd.get('email'), change: fd.get('change'), links: fd.get('links'),
          website: fd.get('website'), pageTitle, pageUrl: location.href.split('#')[0],
          elapsedMs: Date.now() - t0.current, turnstileToken: token.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'it could not be sent just now. please email admin@motplusplusplus.com.');
      setState('done'); track('correction');
      setTimeout(() => setMode(null), 1800); // C5: thank, then close
    } catch (x) { setState('idle'); setErr((x as Error).message); }
  };

  const form = (m: 'sheet' | 'panel') => (
    <Sheet id={`cx-${m}`} mode={m} open={mode === m} onClose={() => setMode(null)} anchor={btn} title="suggest a correction">
      {state === 'done' ? (
        <p className="c-mono" role="status" style={{ fontSize: 13, padding: '18px 0 24px' }}>thank you. we&rsquo;ll look into it.</p>
      ) : (
        <form className="c-form" onSubmit={submit} noValidate>
          <fieldset className="c-radios">
            <legend className="mot-mono mot-label">who you are</legend>
            {([['this-is-me', 'this is me'], ['involved', 'I was involved'], ['visitor', 'visitor']] as const).map(([v, l], i) => (
              <button key={v} type="button" className="mot-opt" aria-pressed={who === v} onClick={() => setWho(v)} data-autofocus={i === 0 ? '' : undefined}>{l}</button>
            ))}
          </fieldset>
          <label>your name (optional)<input name="name" autoComplete="name" maxLength={120} /></label>
          <label>email, so we can reply (optional)<input name="email" type="email" autoComplete="email" maxLength={254} /></label>
          <label>what needs changing<textarea name="change" required maxLength={5000} /></label>
          <label>links (optional)<input name="links" inputMode="url" maxLength={2000} /></label>
          <div className="c-hp" aria-hidden="true"><label>website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <Turnstile onToken={onToken} />
          {err && <p className="c-mono c-err" role="alert">{err}</p>}
          <button type="submit" className="mot-btn mot-btn-solid fs-done" disabled={state === 'sending'}>{state === 'sending' ? 'sending…' : 'send'}</button>
          <p className="c-mono c-quiet" style={{ margin: '0 0 6px', lineHeight: 1.5 }}>photos and documents: send them to <a className="mot-link" href="mailto:admin@motplusplusplus.com">admin@motplusplusplus.com</a> as attachments.</p>
        </form>
      )}
    </Sheet>
  );
  return (
    <div className="c-foot-note">
      <span className="tg-filter-anchor">
        <button ref={btn} type="button" className="mot-link c-mono" onClick={() => (mode ? setMode(null) : open())} aria-haspopup="dialog" aria-expanded={!!mode} style={{ minHeight: 44 }}>
          something wrong or missing? suggest a correction
        </button>
        {form('panel')}
      </span>
      {form('sheet')}
    </div>
  );
}
