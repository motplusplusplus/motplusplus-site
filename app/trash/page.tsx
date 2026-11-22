import type { Metadata } from 'next';
import { getTrashItems } from '@/lib/sanity';
import TrashPageShell from './TrashPageShell';
import { BATCH, DENSE_DEFAULT_QUERY, GRID_DENSE_SIZES, GRID_ID, GRID_SINGLE_SIZES, ORDER_STYLE_ID, PRE_DENSE_CLASS } from '@/lib/trashGrid';
import { imgSrcSet, GRID_DENSE_WIDTHS, GRID_SINGLE_WIDTHS } from '@/lib/workImage';
import { normalizeWork, trashOrder, SEED_KEY, VIEW_KEY, type Work } from '@/lib/trashWork';
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
 *  visitor's session order (weighted toward available works, see
 *  trashOrder), writes it as CSS `order` rules (and hides all but the first
 *  batch), and preloads the first images at high priority. Cards then paint
 *  in their final places as they stream in: no reshuffle, no layout shift,
 *  and the largest image starts downloading with the first bytes of the
 *  page. React removes the <style> once it renders the same order itself.
 *
 *  Dense first view (desktop default, or the visitor's choice): the static
 *  HTML is the one-per-row list, so the grid stays hidden (html.tg-pre-dense)
 *  until React draws the masonry, a few hundred ms on a desktop; a CSS
 *  timeout shows it anyway if scripts fail. The first row's images are
 *  preloaded at their dense sizes meanwhile.
 *
 *  Any failure leaves the canonical order, which React reorders on hydration. */
function orderScript(items: Work[]): string {
  const data = items.map(w => [w._id, w.sold ? 1 : 0, w.images[0].url, w.images[0].w]);
  return `(function(){try{
var D=${JSON.stringify(data).replace(/</g, '\\u003c')};
var K=${JSON.stringify(SEED_KEY)},s=0,v=null;
try{s=Number(sessionStorage.getItem(K))||0;v=sessionStorage.getItem(${JSON.stringify(VIEW_KEY)})}catch(e){}
if(!s){s=Math.floor(Math.random()*4294967295)+1;try{sessionStorage.setItem(K,String(s))}catch(e){}}
window.__motTrashSeed=s;
var dense=v?v==='dense':matchMedia(${JSON.stringify(DENSE_DEFAULT_QUERY)}).matches;
var trashOrder=${trashOrder.toString()};
var imgSrcSet=${imgSrcSet.toString()};
var o=trashOrder(D.map(function(d){return [d[0],d[1]]}),s),img={},css='';
D.forEach(function(d){img[d[0]]=d});
for(var i=0;i<o.length;i++){var sel='#${GRID_ID}>[data-id="'+o[i]+'"]';css+=sel+'{order:'+i+'}';if(i<2)css+=sel+' img{opacity:1!important;transition:none}';if(i>=${BATCH})css+=sel+'{display:none}'}
var st=document.createElement('style');st.id=${JSON.stringify(ORDER_STYLE_ID)};st.textContent=css;document.head.appendChild(st);
if(dense)document.documentElement.classList.add(${JSON.stringify(PRE_DENSE_CLASS)});
var n=dense?(innerWidth>=1200?4:innerWidth>=720?3:2):2;
for(var j=0;j<n&&j<o.length;j++){var d=img[o[j]],ss=imgSrcSet(d[2],dense?${JSON.stringify(GRID_DENSE_WIDTHS)}:${JSON.stringify(GRID_SINGLE_WIDTHS)},d[3]);var l=document.createElement('link');l.rel='preload';l.as='image';if(ss){l.setAttribute('imagesrcset',ss);l.setAttribute('imagesizes',dense?${JSON.stringify(GRID_DENSE_SIZES)}:${JSON.stringify(GRID_SINGLE_SIZES)})}else l.href=d[2];l.setAttribute('fetchpriority','high');document.head.appendChild(l)}
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
