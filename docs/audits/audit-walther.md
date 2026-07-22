# walther.website audit — 2026-07-22

Light pass, as briefed. The plain-HTML/no-build architecture is treated as a
deliberate choice throughout; nothing below suggests a framework, CMS, or
removing the playful material.

## Urgent

1. **The local working copy is being hollowed out by iCloud "Optimize Storage",
   and it breaks git.** `alaska.html`, `.gitignore`, `images/flowers1.png`, and
   `images/childhood/IMG_6798.JPG` are currently evicted (0 bytes on disk,
   content in iCloud). Observed directly: `git status` fails with
   `error: read error while indexing .gitignore: Operation timed out`, and any
   script touching an evicted file hangs. Two real risks: (a) you cannot
   commit/deploy from this machine while offline or on a slow link; (b) a
   deploy tool that tolerates read errors could someday ship 0-byte files.
   The live site is currently fine (alaska.html serves 200). Fix: force-download
   the repo (`brctl download .` recursively, or Finder → "Download Now"), and
   ideally keep this repo outside iCloud-managed folders (task W2).
   *(Note: this same eviction is why one earlier automated scan reported
   alaska.html as unreadable.)*

2. **No other urgent breakage found.** Checked: every local `href`/`src` across
   all top-level pages resolves (0 missing, scripted check); live homepage and
   paintings page 200; visitor-counter Worker
   (`walther-counter.newell-pdx.workers.dev`) responding 200; sitemap entries
   consistent with real pages (a previous session already fixed the 3 missing
   ones).

## Load weight

3. **Gallery "thumbnails" are the full-resolution originals.** `gallery.js`
   sets `thumb.src = r2 + img.filename` — the scroll-row thumbnail *is* the
   full file. Sampled from the live R2 bucket: `jackpot.jpg` 4.5 MB,
   `hand-delivered.jpg` 5.7 MB; others 0.2–1.4 MB. The paintings page (32
   works) can pull tens of MB on a full scroll; on Vietnamese mobile data
   that's minutes, not seconds. `loading="lazy"` is already in place (good) —
   the missing piece is a downscaled thumbnail variant per image, generated
   once by a script and uploaded next to the originals; the lightbox keeps
   loading the full file. No build step required — it's a one-off asset job
   (task W1).
4. **`valentine.html` assets:** `rose1.png` is 3.1 MB live and `rose2.png`
   2.2 MB. For a hidden/personal page this is charming excess, but a 5-minute
   re-export to JPEG/WebP (~200 KB each) keeps the joke and drops 5 MB
   (folded into task W1's script).
5. Everything else is light: pages are 5–16 KB of HTML, hand-written CSS/JS
   totals under 100 KB across the site. The architecture is doing its job.

## Accessibility & mobile

6. **The easter egg and games degrade politely.** The title animation is
   click-triggered (no motion until invited), uses Web Audio defensively
   (try/catch, initialized on gesture), and has separate mobile behavior.
   The homepage has real `aria-label`s on the menu trigger and alt text on
   functional images. Honest gaps, none severe: the falling-letter animation
   ignores `prefers-reduced-motion` (one media-query check before
   `triggerAnimation` would cover it); decorative social icons could take
   `alt=""` consistently; the rotating SVG text is announced to screen readers
   as a wall of "World Wide Web Walther…" (an `aria-hidden="true"` on the SVG
   would quiet it). All are one-line fixes if you ever feel like it — none
   makes the site look neglected.
7. **Mobile layout is deliberate and holds up.** Separate `.mobile-layout`
   with its own grid, landscape-orientation tuning, `overflow-x: hidden`
   guarding the animation. No broken mobile layout found in the pages read.

## Easter-egg discoverability (asked directly)

8. **Slightly under-discoverable on desktop, near-invisible on mobile.** The
   desktop affordance is good: title letters scale on hover, which curious
   cursors will find. On mobile there's no hover, so nothing hints the title
   is tappable — the people most likely to idly poke at a phone screen get no
   invitation. Two register-respecting nudges: (a) a one-time, very slow
   idle wobble of a single letter ~10s after load (subtle enough to feel like
   a glitch, enough to invite a tap); (b) the cursor: the letters already set
   `cursor: pointer` — keep that. The anagram payoff (73 entries deep) rewards
   repeat visitors generously; the depth is wasted only if nobody finds the
   door. Worth the nudge.

## How the work is presented (honest advice)

9. **The site is a self-portrait first and a portfolio second — keep that, but
   let the paintings breathe more.** The homepage (globe, rotating word-ring,
   anagram rain) sets a voice galleries will remember. The gap is between that
   voice and the gallery pages: paintings/drawings render as uniform scroll
   rows with small labels, so "The 100" — a decade-scale, 100-painting
   ambition explicitly described in the data — reads visually identical to a
   casual sketch series. Three suggestions that respect what it is:
   - Give "The 100" one page-level statement of the project (the JSON already
     holds the text) and a count ("32 of 100 shown"), so the ambition registers
     as the artwork it is.
   - One painting, full-width, at the top of paintings.html before the rows —
     an anchor image changes how everything below is read.
   - The exhibitions/CV page is the page a curator or juror will actually
     check; make sure it's current through 2026 (MoT+++/a.Farm roles included —
     the operational-director role is itself credibility for institutional
     contexts).
10. **Small credibility fix:** the homepage JSON-LD `sameAs` points at
    `motplusplusplus.com/artists/andrew-newell-walther` — a legacy namespace
    that 301s to `/profiles/...`. Update to the canonical URL (task W3).

## Not recommended

No framework, no build pipeline, no CMS, no "professionalizing" of hidden
material — reaffirmed after reading the code: the hand-written JS is orderly,
commented, and safer to maintain than a migration would be.
