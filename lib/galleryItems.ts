import type { Img } from './catalogue';
/** Shared by server pages and client islands (never export helpers from a 'use client' file). */
export type GItem = Img & { video?: string | null };
export type GalleryItemShape = { url?: string; w?: number; h?: number; caption?: string | null; credit?: string | null; alt?: string | null; video?: string | null };
export function toGalleryItems(items: GItem[]): GalleryItemShape[] {
  return items.map(i => ({ url: i.url || undefined, w: i.w, h: i.h, caption: i.caption, credit: i.credit, alt: i.alt, video: i.video ?? null }));
}
