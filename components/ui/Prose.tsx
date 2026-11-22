'use client';
/** Paragraphs showing about the first `limit` words, then "read more" expands in
 *  place (P5, E10). The FULL text is always in the HTML (search engines, the
 *  text-parity check, find-in-page): it is only collapsed visually, to roughly
 *  `limit` words of height, with a soft fade. Text is rendered exactly as stored. */
import { useId, useState } from 'react';
import type { Para } from '@/lib/prose';

const WORDS_PER_LINE = 11; // ~65ch at 16px

export default function Prose({ paras, limit = 120, className = 'c-bio', lang }: { paras: Para[]; limit?: number; className?: string; lang?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const words = paras.reduce((n, p) => n + p.map(s => s.t).join('').split(/\s+/).filter(Boolean).length, 0);
  const collapsible = words > limit * 1.3;
  const lines = Math.ceil(limit / WORDS_PER_LINE) + (paras.length > 1 ? 1 : 0);
  return (
    <div className={className} lang={lang}>
      <div
        id={id}
        className={collapsible && !open ? 'c-collapsed' : undefined}
        style={collapsible && !open ? { maxHeight: `${lines * 1.8}em` } : undefined}
      >
        {paras.map((p, i) => (
          <p key={i}>
            {p.map((s, k) => s.href
              ? <a key={k} href={s.href} target={/^https?:/.test(s.href) ? '_blank' : undefined} rel="noopener noreferrer">{s.t}</a>
              : <span key={k}>{s.t}</span>)}
          </p>
        ))}
      </div>
      {collapsible && (
        <button type="button" className="mot-link c-mono c-readmore" aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)} style={{ minHeight: 44 }}>
          {open ? 'read less' : 'read more'}
        </button>
      )}
    </div>
  );
}
