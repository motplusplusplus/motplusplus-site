'use client';

import { useState } from 'react';

/** Phone share sheet where there is one; otherwise copies the link. */
export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && typeof navigator.share === 'function') {
      try { await navigator.share({ title, url }); } catch { /* dismissed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('copy this link', url);
    }
  };
  return (
    <button type="button" className="mot-icon-btn mot-share" onClick={onClick} aria-label="share this work">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
        <path d="M12 4v11M8 8l4-4 4 4M6 12v8h12v-8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="mot-mono mot-quiet" aria-live="polite">{copied ? 'link copied' : 'share'}</span>
    </button>
  );
}
