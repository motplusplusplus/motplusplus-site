import { getCatalogue } from './catalogue';
import { fold } from './fold';
import type { Img } from './catalogue';

export type Entry = {
  slug: string; name: string; aliases: string[]; letter: string; q: string; n: number;
  roles: string[]; labels: string[]; programs: string[]; countries: string[]; disciplines: string[]; based: string | null;
  tile: Img | null; facts: string; w: number;
};

function isoDaysAgo(days: number): string { const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); }

/** P1 weighting, strongest first: available +1 trash works, a.Farm resident,
 *  credited events, activity in the last 12 months (and a real image to show). */
export async function getProfileEntries(): Promise<Entry[]> {
  const c = await getCatalogue();
  const yearAgo = isoDaysAgo(365);
  return c.people.map(p => {
    const works = c.worksByPerson.get(p.slug) ?? [];
    const tile = c.tiles.get(p.slug) ?? null;
    const avail = works.some(w => !w.sold && !w.notForSale);
    const recent = !!p.lastDate && p.lastDate >= yearAgo;
    // label: confirmed disciplines, else non-"artist" credit roles, else none (never a default)
    const facts = [p.labels.slice(0, 2).join(', '), p.sinceYear ? `since ${p.sinceYear}` : '', p.eventSlugs.length ? `${p.eventSlugs.length} event${p.eventSlugs.length === 1 ? '' : 's'}` : '']
      .filter(Boolean).join(' · ');
    const w = (avail ? 8 : 0) + (p.isResident ? 4 : 0) + Math.min(p.eventSlugs.length, 12) * 0.35 + (recent ? 2 : 0) + (tile && (tile.img.w ?? 0) >= 500 ? 3 : tile ? -1 : -4);
    return {
      slug: p.slug, name: p.name, aliases: p.aliases, letter: p.letter,
      q: fold([p.name, ...p.aliases].join(' ')), n: p.eventSlugs.length,
      roles: p.roles, labels: p.labels, programs: p.programs, countries: p.nationalities, disciplines: p.disciplines,
      based: p.basedIn?.country ?? null,
      tile: tile ? { url: tile.img.url, w: tile.img.w, h: tile.img.h, fx: tile.img.fx, fy: tile.img.fy } : null,
      facts, w: Math.round(w * 100) / 100,
    };
  });
}
