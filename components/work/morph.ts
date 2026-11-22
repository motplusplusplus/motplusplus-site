'use client';

/** Grid → work page: the tapped image morphs into the work page's first
 *  image (View Transitions API). A plain client navigation where the API is
 *  missing or reduced motion is on.
 *
 *  Foolproof by construction: only the tapped image carries the transition
 *  name (never two at once), the "new state" callback resolves either when
 *  the work page's image mounts (morphArrived) or after a hard cap, and the
 *  CSS keeps the whole thing at or under 400 ms, so it can never hang a tap. */

import { prefersReducedMotion } from '@/lib/trashWork';

export const MORPH_NAME = 'mot-work-hero';
const NAV_CAP_MS = 700;

let resolveArrival: (() => void) | null = null;

type DocVT = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => { finished: Promise<void> };
};

export function navigateWithMorph(
  push: (href: string) => void,
  href: string,
  img: HTMLImageElement | null,
): void {
  const doc = document as DocVT;
  if (!img || typeof doc.startViewTransition !== 'function' || prefersReducedMotion()) {
    push(href);
    return;
  }
  img.style.viewTransitionName = MORPH_NAME;
  try {
    const t = doc.startViewTransition(() => new Promise<void>(resolve => {
      // the old image must give up the name before the new page's copy
      // is captured, or the browser aborts the transition (two of a name)
      resolveArrival = () => { img.style.viewTransitionName = ''; resolve(); };
      push(href);
      setTimeout(() => resolveArrival?.(), NAV_CAP_MS);
    }));
    // A transition the browser abandons (tab hidden, another one starting)
    // rejects these promises; the navigation itself has already happened.
    const t2 = t as unknown as { ready?: Promise<void>; updateCallbackDone?: Promise<void> };
    t2.ready?.catch(() => {});
    t2.updateCallbackDone?.catch(() => {});
    t.finished.catch(() => {}).finally(() => { img.style.viewTransitionName = ''; resolveArrival = null; });
  } catch {
    img.style.viewTransitionName = '';
    push(href);
  }
}

/** Called by the work page (layout effect) once its first image is in the
 *  DOM. The hero takes the name only for this one transition, so a later
 *  morph out of the same page (related works) never finds two of it. */
export function morphArrived(hero: HTMLElement | null): void {
  const r = resolveArrival;
  if (!r) return;
  resolveArrival = null;
  if (hero) {
    hero.style.viewTransitionName = MORPH_NAME;
    setTimeout(() => { hero.style.viewTransitionName = ''; }, 800);
  }
  r();
}
