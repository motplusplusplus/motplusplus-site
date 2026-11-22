'use client';
/** D8: anonymous counts of a few clicks (drift, wall saves, shares, notify-me,
 *  inquire). Only the event name and the page path are sent: no cookies, no ids,
 *  no addresses. The worker writes them to Workers Analytics Engine (/api/t). */
export type TrackEvent = 'drift' | 'wall-save' | 'wall-share' | 'share' | 'notify-me' | 'inquire' | 'correction';
export function track(name: TrackEvent) {
  try {
    const body = JSON.stringify({ e: name, p: window.location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/t', new Blob([body], { type: 'application/json' }));
    else fetch('/api/t', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  } catch { /* never let counting break a page */ }
}
