/**
 * The placeholder shown when an event has no image of its own.
 *
 * ONE ELEMENT, ONE ASSET. The MoT+++ wordmark used to be pasted onto individual event
 * documents as an image asset to fill blanks — 87 copies across 54 events, removed
 * 2026-08-11. A placeholder is a rendering concern, not a per-document asset.
 *
 * THE ASSET is public/motplus-wordmark-light.png — the 378x77 wordmark recovered from the
 * copies that were pasted onto events, saved locally so the placeholder does not depend on
 * an R2 URL. It is a transparent PNG whose marks are mid-grey (134,134,134), so it reads on
 * the dark ground without carrying a baked-in background of its own.
 *
 * WHY THE LIGHT WORDMARK. Every container that shows an event image sits on #111111:
 * the event hero (70vh), the listings hero (55vh), the 4/3 card, and the 80x60 thumb —
 * 30 such containers in the codebase. A dark mark on that ground is invisible, so the
 * light variant is the only one that can work. The dark square asset that used to be the
 * code fallback had the same problem in a different place and has been removed.
 *
 * WHY IT CANNOT USE object-fit: cover. The wordmark is 378x77 — 4.9:1 — and every
 * container is landscape but nowhere near that wide. `cover` scales to fill and crops the
 * overflow, which on a 4/3 card means showing the middle of two letters. `contain` inside
 * a flex-centred box keeps the mark whole and lets the container fill around it, which is
 * what a placeholder is for.
 *
 * WHY THE WIDTH IS CAPPED IN PERCENT. At 4.9:1 in an 80x60 thumb, `contain` alone would
 * fit the mark to the width and leave it 16px tall — legible as a smudge, not a wordmark.
 * The cap is expressed against the container so the mark holds the same visual weight at
 * every size, and `maxHeight` stops it overflowing a container that is taller than it is
 * wide.
 */
type Size = 'hero' | 'card' | 'thumb';

/**
 * Width the mark occupies, as a share of its container. Smaller containers give the mark
 * proportionally MORE room: at thumb size a 60% mark is unreadable, so it takes 88%.
 */
const WIDTH: Record<Size, string> = {
  hero: '22%',   // 70vh / 55vh heroes — quiet; a large container needs no help being seen
  card: '34%',   // 4/3 card in a grid — small, so a grid of placeholders recedes
                 // rather than tiling into a wall of identical wordmarks
  thumb: '88%',  // 80x60 — nearly full width, or it disappears
};

export default function EventImagePlaceholder({
  size = 'card',
  title,
}: {
  size?: Size;
  /** Used for the alt text so the placeholder is not announced as "MoT+++" on every card. */
  title?: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111111',
      }}
      aria-hidden={title ? undefined : true}
    >
      <img
        src="/motplus-wordmark-light.png"
        alt={title ? `${title} — no documentation image` : ''}
        style={{
          width: WIDTH[size],
          maxWidth: '88%',
          maxHeight: '62%',
          height: 'auto',
          objectFit: 'contain',
          display: 'block',
          // Damped hard. A single placeholder can afford to be legible; a grid of them
          // must recede into the dark ground instead of reading as a broken section.
          opacity: 0.5,
        }}
      />
    </div>
  );
}
