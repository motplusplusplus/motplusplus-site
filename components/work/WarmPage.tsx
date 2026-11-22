import { preconnect } from 'react-dom';

/** Warm off-white page (and header, footer grays) for the +1 trash, work
 *  and profile pages. A plain <style> rendered with the page: it applies
 *  before first paint and leaves with the page on client navigation.
 *  #6e6a64 keeps footer text at AA (4.85:1) on #f6f3ee, where the site's
 *  usual #767676 is only 4.10:1.
 *
 *  Also opens the connection to the Sanity image CDN up front: every work
 *  image is on cdn.sanity.io, and on a phone its DNS + TCP + TLS setup was
 *  most of the wait before the first image could even start downloading. */
export default function WarmPage() {
  preconnect('https://cdn.sanity.io');
  return (
    <style>{'body{background:#f6f3ee;--mot-page-bg:#f6f3ee;--mot-text-quiet:#6e6a64}'}</style>
  );
}
