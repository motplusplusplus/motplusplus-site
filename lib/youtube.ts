/** YouTube URL helpers: pure, safe in client bundles. */

/** The video id from any YouTube URL form (embed, watch, youtu.be, shorts). */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (!/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname)) return null;
    const v = u.searchParams.get('v');
    if (v) return v;
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/);
    return m ? m[1] : null;
  } catch { return null; }
}
