/** Text → paragraphs of segments, for components/ui/Prose. Wording is never
 *  changed: only split into paragraphs and links. Client-safe. */
export type Seg = { t: string; href?: string };
export type Para = Seg[];

/** Portable text blocks (artist.bio) → paragraphs, keeping link marks. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromPortableText(blocks: any[]): Para[] {
  return blocks.filter(b => b?._type === 'block').map(b => {
    const defs = new Map<string, string>((b.markDefs ?? []).filter((d: { _type: string }) => d._type === 'link').map((d: { _key: string; href: string }) => [d._key, d.href]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (b.children ?? []).map((c: any) => {
      const href = (c.marks ?? []).map((m: string) => defs.get(m)).find(Boolean);
      return href ? { t: c.text ?? '', href } : { t: c.text ?? '' };
    });
  }).filter((p: Para) => p.some(s => s.t.trim()));
}

/** Plain text with blank-line paragraphs and [text](url) links (event descriptions). */
export function fromText(text: string): Para[] {
  return (text ?? '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p =>
    p.split(/(\[[^\]]+\]\([^)]+\))/g).filter(Boolean).map(part => {
      const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      return m ? { t: m[1], href: m[2] } : { t: part };
    }));
}

export function toParas(bio: unknown): Para[] {
  return Array.isArray(bio) ? fromPortableText(bio) : fromText(typeof bio === 'string' ? bio : '');
}
export const wordCount = (ps: Para[]) => ps.reduce((n, p) => n + p.map(s => s.t).join('').split(/\s+/).filter(Boolean).length, 0);
export const plainOf = (ps: Para[]) => ps.map(p => p.map(s => s.t).join('')).join('\n\n');
