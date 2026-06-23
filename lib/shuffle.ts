/** Fisher-Yates shuffle. Shared by anything that wants a randomized display
 *  order without baking a fixed order into the static export -- call this
 *  client-side (e.g. in a useEffect) so each visit gets its own order rather
 *  than every visitor getting the same "random" order until the next deploy. */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
