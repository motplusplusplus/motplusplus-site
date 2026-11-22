import { getCatalogue } from '@/lib/catalogue';
import { imgSrc } from '@/components/cat/Pieces';

export const dynamic = 'force-static';

/** Compact index of every work, person and event, for drift (D1) and the wall (D3).
 *  [id, href, title, sub, thumb, w, h, good] — "good" marks items with a real image
 *  big enough to land on. */
export async function GET() {
  const c = await getCatalogue();
  const rows: [string, string, string, string, string | null, number, number, 0 | 1, 0 | 1][] = [];
  for (const w of c.works) {
    if (!w.slug) continue;
    const i = w.images[0];
    rows.push([`w:${w.slug}`, `/trash/${w.slug}/`, w.title, `${w.artist}${w.year ? `, ${w.year}` : ''}`, i ? imgSrc({ url: i.url, w: i.w }, 480) : null, i?.w ?? 0, i?.h ?? 0, i && i.w >= 600 ? 1 : 0, !w.sold && !w.notForSale ? 1 : 0]);
  }
  for (const p of c.people) {
    if (p.isLena) { rows.push([`a:${p.slug}`, `/profiles/${p.slug}/`, p.name, 'MoTcyclopedia', null, 0, 0, 0, 0]); continue; }
    const t = c.tiles.get(p.slug);
    rows.push([`a:${p.slug}`, `/profiles/${p.slug}/`, p.name, p.roles[0] ?? 'MoTcyclopedia', t ? imgSrc(t.img, 480) : null, t?.img.w ?? 0, t?.img.h ?? 0, t && (t.img.w ?? 0) >= 500 ? 1 : 0, 0]);
  }
  for (const e of c.listed) {
    rows.push([`e:${e.slug}`, `/events/${e.slug}/`, e.title, [e.year, e.category].filter(Boolean).join(' · '), e.cover ? imgSrc(e.cover, 480) : null, e.cover?.w ?? 0, e.cover?.h ?? 0, e.cover && !e.coverIsPoster && (e.cover.w ?? 0) >= 600 ? 1 : 0, 0]);
  }
  return Response.json(rows);
}
