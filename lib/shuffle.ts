/** Fisher-Yates shuffle. Two sanctioned call sites, with opposite tradeoffs:
 *  client-side (per-visit order, but the shuffled content is absent from the
 *  static HTML until hydration) or build-time in a server component (order is
 *  fixed until the next deploy, but the grid paints with the first HTML --
 *  /trash uses this, since content deploys re-roll the order every few
 *  minutes anyway). */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
