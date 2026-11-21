import type { Metadata } from 'next';
import { getTrashItems } from '@/lib/sanity';
import TrashPageShell from './TrashPageShell';
import { BATCH, GRID_ID, GRID_SINGLE_SIZES, ORDER_STYLE_ID } from '@/lib/trashGrid';
import { imgSrcSet, imgUrl, GRID_SINGLE_WIDTHS } from '@/lib/workImage';
import { normalizeWork, seededOrder, SEED_KEY, type Work } from '@/lib/trashWork';
import { ogImage } from '@/lib/og';
import WarmPage from '@/components/work/WarmPage';

const TITLE = '+1 trash ♻ | artworks for acquisition, ho chi minh city';
const DESCRIPTION =
  'works consigned directly by artists through +1 trash, the acquisition program of MoT+++ in ho chi minh city. browse available and sold works, inquire by email.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: 'works consigned directly by artists through +1 trash, the acquisition program of MoT+++ in ho chi minh city.',
    url: 'https://motplusplusplus.com/trash',
    images: [ogImage(undefined, 'MoT+++')],
  },
  twitter: { card: 'summary_large_image', title: TITLE, images: [ogImage(undefined, 'MoT+++').url] },
  alternates: { canonical: 'https://motplusplusplus.com/trash' },
};

/** Runs at the top of the page, BEFORE the grid's HTML arrives: decides this
 *  visitor's session order, writes it as CSS `order` rules (and hides all
 *  but the first batch), and preloads the first two images at high
 *  priority. Cards then paint in their final places as they stream in: no
 *  reshuffle, no layout shift, and the largest image starts downloading
 *  with the first bytes of the page. React removes the <style> once it
 *  renders the same order itself. Any failure leaves the canonical order,
 *  which React reorders on hydration. */
function orderScript(items: Work[]): string {
  const data = items.map(w => {
    const img = w.images[0];
    return [w._id, imgSrcSet(img.url, GRID_SINGLE_WIDTHS, img.w) ?? imgUrl(img.url, 800)];
  });
  return `(function(){try{
var D=${JSON.stringify(data).replace(/</g, '\\u003c')};
var K=${JSON.stringify(SEED_KEY)},s=0;
try{s=Number(sessionStorage.getItem(K))||0}catch(e){}
if(!s){s=Math.floor(Math.random()*4294967295)+1;try{sessionStorage.setItem(K,String(s))}catch(e){}}
window.__motTrashSeed=s;
var seededOrder=${seededOrder.toString()};
var o=seededOrder(D.map(function(d){return d[0]}),s),src={},css='';
D.forEach(function(d){src[d[0]]=d[1]});
for(var i=0;i<o.length;i++){var sel='#${GRID_ID}>[data-id="'+o[i]+'"]';css+=sel+'{order:'+i+'}';if(i<2)css+=sel+' img{opacity:1!important;transition:none}';if(i>=${BATCH})css+=sel+'{display:none}'}
var st=document.createElement('style');st.id=${JSON.stringify(ORDER_STYLE_ID)};st.textContent=css;document.head.appendChild(st);
for(var j=0;j<2&&j<o.length;j++){var l=document.createElement('link');l.rel='preload';l.as='image';l.setAttribute('imagesrcset',src[o[j]]);l.setAttribute('imagesizes',${JSON.stringify(GRID_SINGLE_SIZES)});l.setAttribute('fetchpriority','high');document.head.appendChild(l)}
}catch(e){}})();`;
}

export default async function TrashPage() {
  const raw = await getTrashItems();
  const items: Work[] = (raw as unknown[])
    .map((r, i) => normalizeWork(r, i))
    .filter((w): w is Work => !!w && w.images.length > 0 && !w.notForSale)
    // the grid and viewer never show these; keep the page payload small
    .map(w => ({ ...w, description: '', shownIn: [], images: w.images.map(i => ({ ...i, lqip: undefined })) }));

  return (
    <div className="mot-warm tg">
      <WarmPage />
      <header className="tg-head">
        <h1 className="tg-h1">+1 trash ♻</h1>
      </header>
      <script dangerouslySetInnerHTML={{ __html: orderScript(items) }} />
      <TrashPageShell items={items} />
    </div>
  );
}
